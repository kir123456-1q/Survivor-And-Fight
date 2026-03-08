/**
 * Body UI 绑定。bodyNode 为 Body 预制体实例（如 PlayerBody.lh），
 * 其下须有 BloodBar > ProgressBar 节点路径，供血条同步使用。
 */
export class BodyUIComponent {
    constructor(public bodyNode: any) {}
}
