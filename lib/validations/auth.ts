import * as z from "zod"

export const userAuthSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(3).optional(),
  password: z.string().min(1),
}).refine(
  (data) => data.email || data.username,
  {
    message: "Either email or username must be provided",
    path: ["email", "username"],
  }
)
