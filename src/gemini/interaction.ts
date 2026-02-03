export type InteractionOptions = {
  id?: string;
  model?: string;
  input?: string;
  system_instruction?: string;
  tools?: Array<any>;
  generation_config?: { thinking_level: 'HIGH' };
};

export default class Interaction {
  public previous_interaction_id?: string;
  public model: string;
  public input: string;
  public system_instruction?: string;
  public tools: Array<any>;
  public generation_config: { thinking_level: 'HIGH' };
  public stream: boolean;

  constructor({
    id,
    model = "gemini-2.5-pro",
    input = "",
    system_instruction,
    tools = [],
    generation_config = { thinking_level: 'HIGH' },
  }: InteractionOptions = {}) {
    if (id) this.previous_interaction_id = id;
    this.model = model;
    this.input = input;
    if (system_instruction) this.system_instruction = system_instruction;
    this.tools = tools;
    this.generation_config = generation_config;
    this.stream = false;
  }
}
