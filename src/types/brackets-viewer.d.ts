declare module "brackets-viewer" {
  export class BracketsViewer {
    constructor(container: HTMLElement, options?: any);
    render(data: any): Promise<void>;
  }
  export default BracketsViewer;
}