const onboardingService = require("./onboarding.service");
const { registerSchema, loginSchema } = require("./onboarding.validation");

class OnboardingController {
  // Handle new employee registration
  async register(req, res, next) {
    try {
      // Validate incoming request against register Zod schema
      const validated = registerSchema.parse(req.body);
      
      const user = await onboardingService.register(
        validated.name,
        validated.email,
        validated.password
      );

      return res.status(201).json({
        status: "success",
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  // Handle user authentication, setting the JWT in an httpOnly cookie
  async login(req, res, next) {
    try {
      // Validate credentials against login Zod schema
      const validated = loginSchema.parse(req.body);
      
      const { user, token } = await onboardingService.login(
        validated.email,
        validated.password
      );

      // Secure HTTP-only cookie configuration parameters
      const cookieOptions = {
        httpOnly: true,
        sameSite: process.env.COOKIE_SAME_SITE || "strict",
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // Expires in 24 hours
        path: "/",
      };

      // Set cookie and return success response containing user object
      res.cookie("token", token, cookieOptions);

      return res.status(200).json({
        status: "success",
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  // Perform idempotent cookie clearance logout operation
  async logout(req, res, next) {
    try {
      res.clearCookie("token", {
        httpOnly: true,
        sameSite: process.env.COOKIE_SAME_SITE || "strict",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });

      return res.status(200).json({
        status: "success",
        message: "Successfully logged out",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OnboardingController();
