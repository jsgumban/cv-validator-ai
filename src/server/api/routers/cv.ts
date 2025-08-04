import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const CvInputSchema = z.object({
  fullName: z.string(),
  email: z.string().email(),
  phone: z.string(),
  skills: z.string(),
  experience: z.string(),
  pdfPath: z.string(),
  isValid: z.boolean(),
});

export const cvRouter = createTRPCRouter({
  submit: publicProcedure
    .input(CvInputSchema)
    .mutation(async ({ ctx, input }) => {
      console.log('inputX: ', input);
      const submission = await ctx.db.cvSubmission.create({
        data: input,
      });

      return {
        isValid: input.isValid,
        submissionId: submission.id,
      };
    }),
});
