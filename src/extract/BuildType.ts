export default class BuildType {
  private readonly buildType: string;
  public constructor(type: string) {
    this.buildType = type;
  }
  public isAlpha(): boolean {
    return this.buildType === 'a';
  }
  public isPatch(): boolean {
    return this.buildType === 'p';
  }
}
