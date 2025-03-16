declare module 'replicate' {
  interface PredictionOptions {
    version: string;
    input: Record<string, any>;
    webhook?: string;
    webhook_events_filter?: string[];
  }

  interface Prediction {
    id: string;
    status: string;
    input: Record<string, any>;
    output: any;
    error?: string;
    logs?: string;
  }

  class Predictions {
    create(options: PredictionOptions): Promise<Prediction>;
    get(id: string): Promise<Prediction>;
    cancel(id: string): Promise<Prediction>;
  }

  interface ReplicateOptions {
    auth: string;
  }

  export default class Replicate {
    predictions: Predictions;
    constructor(options: ReplicateOptions);
  }
} 