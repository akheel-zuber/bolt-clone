import { WebContainer } from '@webcontainer/api';

export class WebContainerService {
  private static instance: WebContainer | null = null;
  private static isBooting = false;
  private static bootPromise: Promise<WebContainer> | null = null;

  static async getInstance(): Promise<WebContainer> {
    if (this.instance) {
      return this.instance;
    }

    if (this.bootPromise) {
      return this.bootPromise;
    }

    this.bootPromise = WebContainer.boot();

    try {
      this.instance = await this.bootPromise;
      return this.instance;
    } catch (error) {
      this.bootPromise = null;
      throw error;
    }
  }
}