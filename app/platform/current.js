// Fallback when no per-platform file matches: this slice builds only h5 and weapp.
throw new Error(`Number Sense Lab slice has no platform implementation for TARO_ENV=${process.env.TARO_ENV}`);
