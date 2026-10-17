export type Validator<T> = {
  validate(value: unknown): asserts value is T;
};
