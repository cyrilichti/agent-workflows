import { loadBridgeConfig } from './config/bridge-config.mjs';
import { createAiProvider } from './providers/ai-provider-factory.mjs';
import { TaskExecutionService } from './execution/task-execution-service.mjs';
import { createLangfuseTraceClient } from './observability/langfuse-trace-client.mjs';
import { createBridgeHttpServer } from './server.mjs';

const config = loadBridgeConfig();
const taskExecution = new TaskExecutionService({
  provider: createAiProvider(config.providerName, config.providerOptions),
  providerName: config.providerName,
  model: config.model || 'configured-default',
  trace: createLangfuseTraceClient(config.langfuse),
  publicUrl: config.langfuse.publicUrl,
  projectId: config.langfuse.projectId,
  ...config.execution,
});
const httpServer = createBridgeHttpServer({
  taskExecution,
  token: config.http.token,
  providerName: config.providerName,
});
httpServer.listen(config.http.port, config.http.host, () => {
  console.log(
    `Local bridge ready on port ${config.http.port} (${config.providerName}); inference enabled: ${taskExecution.enabled}`,
  );
});
for (const event of ['SIGTERM', 'SIGINT']) {
  process.once(event, () => {
    taskExecution.cancelActiveTask();
    httpServer.close();
  });
}
