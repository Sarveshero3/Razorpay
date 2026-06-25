CREATE TYPE "public"."user_role" AS ENUM('EMP', 'RM', 'APE', 'CFO');--> statement-breakpoint
CREATE TYPE "public"."reimbursement_status" AS ENUM('PENDING', 'REJECTED', 'APPROVED');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'EMP' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "reporting_assignments" (
	"emp_id" uuid PRIMARY KEY NOT NULL,
	"rm_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reimbursements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"amount" double precision NOT NULL,
	"status" "reimbursement_status" DEFAULT 'PENDING' NOT NULL,
	"rm_approved" boolean DEFAULT false NOT NULL,
	"ape_approved" boolean DEFAULT false NOT NULL,
	"approved_by_rm_id" uuid,
	"approved_by_ape_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reporting_assignments" ADD CONSTRAINT "reporting_assignments_emp_id_users_id_fk" FOREIGN KEY ("emp_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reporting_assignments" ADD CONSTRAINT "reporting_assignments_rm_id_users_id_fk" FOREIGN KEY ("rm_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reimbursements" ADD CONSTRAINT "reimbursements_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reimbursements" ADD CONSTRAINT "reimbursements_approved_by_rm_id_users_id_fk" FOREIGN KEY ("approved_by_rm_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reimbursements" ADD CONSTRAINT "reimbursements_approved_by_ape_id_users_id_fk" FOREIGN KEY ("approved_by_ape_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;