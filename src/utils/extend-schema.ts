import Mongoose, {
    SchemaDefinition,
    SchemaOptions,
    Schema as SchemaInterface
} from 'mongoose'

export const ExtendSchema = (
    Schema: SchemaInterface,
    definition: SchemaDefinition,
    options: SchemaOptions
): SchemaInterface =>
    new Mongoose.Schema(Object.assign({}, Schema.obj, definition), options)
