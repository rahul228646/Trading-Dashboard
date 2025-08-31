export class IdGenerator {
  private static currentId = 1;

  static generateOrderId(): number {
    return this.currentId++;
  }

  static generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static resetOrderId(): void {
    this.currentId = 1;
  }
}
