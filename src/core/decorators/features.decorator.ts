import { SetMetadata } from '@nestjs/common';

export const FEATURES_KEY = 'features';
export const RequiredFeatures = (...features: string[]) =>
  SetMetadata(FEATURES_KEY, features);
