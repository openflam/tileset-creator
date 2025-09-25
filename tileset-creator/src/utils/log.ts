type LogLevel = "debug" | "info" | "warn" | "error";

const levels: Record<LogLevel, number> = {
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
};

function consoleLog(message: any, level: LogLevel = "info") {
  const envLevel = (import.meta.env.VITE_LOGGER_LEVEL as LogLevel) || "info";
  if (levels[level] >= levels[envLevel]) {
    console.log(message);
  }
}

export { consoleLog };
