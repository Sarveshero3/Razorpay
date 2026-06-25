const onboardingRepository = require("./onboarding.repository");
const { hashPassword, comparePassword } = require("../../utils/password");
const { ConflictError, UnauthorizedError } = require("../../utils/errors");
const { signToken } = require("../../utils/jwt");

class OnboardingService {
  async register(name, email, password) {
    // Check if the email already exists to raise 409 Conflict
    // Why: Spec explicitly requires checking this before db write instead of letting DB error leak
    const existingUser = await onboardingRepository.findUserByEmail(email);
    if (existingUser) {
      throw new ConflictError("Email is already registered");
    }

    // Hash the password securely
    const passwordHash = await hashPassword(password);

    // Create user with default role 'EMP'
    const newUser = await onboardingRepository.createUser({
      name,
      email,
      passwordHash,
      role: "EMP",
    });

    // Remove password hash from the returned payload
    const { passwordHash: _, ...userWithoutHash } = newUser;
    return userWithoutHash;
  }

  async login(email, password) {
    const user = await onboardingRepository.findUserByEmail(email);
    
    // If the email is not found, or password compare fails, throw generic 401 message
    // Why: Spec mandates returning the same message to prevent exposing user registration status
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isPasswordMatch = await comparePassword(password, user.passwordHash);
    if (!isPasswordMatch) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // Sign the JWT containing the essential payload (id + current role)
    const token = signToken({ userId: user.id, role: user.role });

    const { passwordHash: _, ...userWithoutHash } = user;
    return {
      user: userWithoutHash,
      token,
    };
  }
}

module.exports = new OnboardingService();
