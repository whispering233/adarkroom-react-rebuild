# 开发计划

## 架构设计
- 世界地图
  - (done) 格子不存放具体信息，格子改为存放Entity引用和Entity参数；
    - Entity 暴露统一的纯函数接口，返回canvas绘图信息
    - 逻辑计算渲染时，根据Entity引用，找到对应Entity，传入Entity参数，纯函数式计算返回
    - 逻辑计算封装所有canvas绘图信息，传给canvas渲染
  - (done) Entity 派生
    - 城市派生出具体城市表现和行为