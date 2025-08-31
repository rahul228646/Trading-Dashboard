export class Logger {
  private static formatMessage(
    level: string,
    message: string,
    ...args: any[]
  ): string {
    const timestamp = new Date().toISOString();
    const formattedArgs =
      args.length > 0
        ? " " +
          args
            .map((arg) =>
              typeof arg === "object" ? JSON.stringify(arg) : String(arg)
            )
            .join(" ")
        : "";
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${formattedArgs}`;
  }

  static info(message: string, ...args: any[]): void {
    console.log(this.formatMessage("info", message, ...args));
  }

  static error(message: string, ...args: any[]): void {
    console.error(this.formatMessage("error", message, ...args));
  }

  static warn(message: string, ...args: any[]): void {
    console.warn(this.formatMessage("warn", message, ...args));
  }

  static debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === "development") {
      console.debug(this.formatMessage("debug", message, ...args));
    }
  }
}
