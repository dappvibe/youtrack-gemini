export default class Response {
  public id?: string;
  public outputs?: Array<{ type: string; text?: string }>;

  constructor(raw: object) {
    Object.assign(this, raw);
  }

  toString() {
    let output = '';
    if (this.outputs) {
      for (const out of this.outputs) {
        if (out.type === 'text' && out.text) {
          output += out.text;
        }
      }
    }
    return output.trim();
  }
}
