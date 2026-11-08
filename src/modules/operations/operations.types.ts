import { z } from "zod";
import { OperationsSchema, OperationsInsertSchema, OperationsGeneratedInsertSchema, OperationsUpdateSchema, OperationsIdUpdateSchema, OperationsIdDeleteSchema } from "./operations.schema";


/* SELECT */
export type Operation = z.infer<typeof OperationsSchema>;

/* INSERT */
export type OperationInsert = z.infer<typeof OperationsInsertSchema>;
export type OperationGeneratedInsert = z.infer<typeof OperationsGeneratedInsertSchema>;

/* UPDATE */
export type OperationsIdUpdate = z.infer<typeof OperationsIdUpdateSchema>;
export type OperationUpdate = z.infer<typeof OperationsUpdateSchema>;

/* DELETE */
export type OperationsIdDelete = z.infer<typeof OperationsIdDeleteSchema>;
