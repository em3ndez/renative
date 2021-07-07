import { Constants, Logger, PlatformManager, TaskManager } from 'rnv';
import { SDKWindows } from '../sdks';


const { logErrorPlatform } = PlatformManager;
const { logTask } = Logger;
const {
    WINDOWS,
    TASK_RUN,
    TASK_CONFIGURE,
    PARAMS
} = Constants;
const { ruWindowsProject } = SDKWindows;
const { executeOrSkipTask, shouldSkipTask } = TaskManager;


export const taskRnvRun = async (c, parentTask, originTask) => {
    const { platform } = c;
    const { port } = c.runtime;
    const { target } = c.runtime;
    const { hosted } = c.program;
    logTask('taskRnvRun', `parent:${parentTask} port:${port} target:${target} hosted:${hosted}`);

    await executeOrSkipTask(c, TASK_CONFIGURE, TASK_RUN, originTask);

    if (shouldSkipTask(c, TASK_RUN, originTask)) return true;

    switch (platform) {
        case WINDOWS:
            c.runtime.shouldOpenBrowser = true;
            return ruWindowsProject(c);
        default:
            return logErrorPlatform(c);
    }
};

export default {
    description: 'Run your app in a window on desktop',
    fn: taskRnvRun,
    task: TASK_RUN,
    params: PARAMS.withBase(PARAMS.withConfigure(PARAMS.withRun())),
    platforms: [
        WINDOWS
    ],
};
