import { Constants, Logger, TaskManager } from 'rnv';

const { logTask } = Logger;
const {
    MACOS,
    WINDOWS,
    LINUX,
    TASK_EXPORT,
    TASK_DEPLOY,
    PARAMS
} = Constants;
const { executeOrSkipTask, shouldSkipTask } = TaskManager;

export const taskRnvDeploy = async (c, parentTask, originTask) => {
    logTask('taskRnvDeploy', `parent:${parentTask}`);

    await executeOrSkipTask(c, TASK_EXPORT, TASK_DEPLOY, originTask);

    if (shouldSkipTask(c, TASK_DEPLOY, originTask)) return true;

    // Deploy simply trggets hook
    return true;
};

export default {
    description: 'Deploy the binary via selected deployment intgeration or buld hook',
    fn: taskRnvDeploy,
    task: TASK_DEPLOY,
    params: PARAMS.withBase(PARAMS.withConfigure()),
    platforms: [
        MACOS,
        WINDOWS,
        LINUX
    ],
};
