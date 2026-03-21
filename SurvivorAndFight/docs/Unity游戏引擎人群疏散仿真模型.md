# 基于物理的人群疏散模型在Unity游戏引擎中的实现

**作者**：Walter Alan Cantrell*, Mikel D. Petty⁺, Samantha L. Knight#, Whitney K. Schueler§

**机构**：University of Alabama in Huntsville（阿拉巴马大学亨茨维尔分校）
301 Sparkman Drive, OKT N353, Huntsville, Alabama 35899, United States of America

**收稿日期**：2016年12月20日
**接受日期**：2018年2月5日
**发布日期**：2018年3月14日

---

## 摘要

人群经常出现在封闭或受限空间中。在这种情形下，疏散通常是有序进行的，但真实或感知到的危险可能引发恐慌。在恐慌的人群中，人群成员通常保持的人际距离往往会被相互推搡的物理压力所淹没。这种压力既能减缓疏散速度，也可能导致伤亡。已经有很多模型被开发出来用于研究各种情况下的人群疏散问题。本文描述了使用商业计算机游戏引擎Unity实现、测试和验证人群疏散模型的过程。我们实现了一个基于物理学的逼真人群移动模型，该模型计算并考虑了人群成员之间施加的物理压力。该模型在非恐慌和恐慌两种场景下进行了测试；这些测试展示了此类场景的已知定性特征。然后，通过将模型结果与实际疏散事件（2003年罗得岛州Station夜总会火灾）进行比较，对模型进行了定量验证。实现和验证表明，Unity可以作为疏散建模的有效工具。

**关键词**：人群建模；人群移动；疏散建模；游戏引擎；Unity

---

## 1. 引言与动机

在现代社会，人群经常聚集在封闭或受限空间中。这种情况可能发生在许多场合，包括体育赛事、音乐会、政治集会和宗教活动。虽然这些场合中的人群通常保持平静，但人群中的恐慌可能由真实和感知的威胁触发，例如看到火灾、闻到胡椒喷雾的味道，甚至只是看到有人奔跑。在恐慌情况下，从密闭空间疏散人群可能是危险且可能致命的。恐慌的人群成员可能会踩踏或相互推搡足够大的力量，导致因踩踏或挤压而造成的伤亡。人群在没有任何原因的情况下恐慌的情况时有发生，导致悲剧性后果。已经有记载涵盖了大约150年的此类事件。

本文的预期范围并不像人群移动总体甚至人群疏散那样广泛。相反，本文主要关注两个方面的贡献。首先，详细描述了在计算机游戏引擎（特别是Unity）中实现基于物理的人群移动模型的机制，而不是使用仿真平台或通用编程语言。目的是使人群建模研究人员能够使用游戏引擎作为开发和测试人群移动模型的环境，并帮助计算机游戏开发人员实现物理上逼真的人群移动模型。为此，本文以足够的细节呈现了基于Unity的实现，以促进类似的实现。其次，报告了基于实际人群疏散事件对所实现模型进行的定量验证，以表明该模型可以具有逼真的准确性，并展示验证过程。

选择Unity游戏引擎作为实现环境，是因为与其他环境或高级编程语言相比，创建现实或想象的世界的三维（3D）逼真表示相对容易。Unity是一个常用于开发视频游戏的跨平台游戏引擎。游戏引擎通常包含用于2D或3D图形生成的渲染引擎，以及包含碰撞检测功能的物理引擎。这些属性对于开发人群模型特别有用。Unity也可以免费提供给学生们使用，并且有许多资源可供下载。

本文的结构如下。第2节简要回顾了相关工作。第3节解释了基于物理的人群移动模型。第4节详细介绍了使用Unity游戏引擎实现人群移动模型和模拟人群移动的虚拟世界，包括非恐慌和恐慌疏散之间的差异。本节还描述了对实现模型的功能测试。第5节报告了使用实际人群疏散事件对实现模型进行的定量验证。最后，第6节报告了研究结果和未来工作建议。

---

## 2. 相关工作

关于人群建模的研究文献广泛而庞大，全面综述超出了本文的范围。相反，我们呈现了选定的代表性示例，旨在将本文的主题——在游戏引擎中实现逼真的人群移动模型——置于更大的人群建模研究背景下进行介绍。建议有兴趣更广泛的读者参阅更全面的综述。

区分人群行为模型和人群移动模型是有用的。人群行为模型复制人群成员关于执行什么动作的心理决策。人群成员可用的动作库通常取决于模型的预期用途。它们可能仅限于疏散模型的移动动作，或者可能包括非移动动作，例如在抗议和骚乱模型中唱歌、扔石头或挥旗。人群行为模型可能使用任何范围的建模方法，包括来自人工智能（AI）的各种方法。个人、文化和情境因素会影响人群成员的行为。例如，一项关于观察到的人群成员特定动作的范围和频率及其与人群成员心理状态关系的实证研究被用作使用游戏技术实现的人群行为模型的基础。

相比之下，人群移动是众多人群行为类型中的一种。一旦人群行为模型、脚本或其他方法确定人群成员应该移动到新位置，人群移动模型就应该执行移动。可以包括从人群成员的起始位置到其预期目的地的路线移动前规划。人群移动模型复制人群成员从一个位置到另一个位置的身体移动。人群移动模型可能基于物理学或运动学。逼真的移动很重要，因为人类观察者对模拟人类即使稍微不自然的行为也非常敏感。人群移动模型与个体移动模型的不同之处在于，人群模型应该考虑人群移动的特征——近距离和由此产生的拥堵。地形、天气和其他因素也可能影响移动。

Reynolds著名的鸟群运动模型（他称之为"boids"）是人群移动建模的重要推动力。该模型使用了粒子系统的思想，将每只鸟表示为一个粒子。类似地，基于粒子系统的模型最近被用于火灾疏散研究。元胞自动机被应用于表示人群成员的导航。一个专门针对高速移动且其运动动力学（加速度、速度和转弯半径）很重要的近距离移动群体模型特别关注碰撞避免。一种专门为高密度人群开发的人群成员移动算法，将代表目的地、墙壁、障碍物、其他人群成员和方向滞后的贡献力向量的加权求和计算为人群成员移动的力向量（方向）。

人群移动模型通常与底层地形表示密切相关。用于城市紧急搜索和救援行动模拟的人群移动模型依赖于将地形区域预先离散化为节点和边图。人群成员根据为每个节点计算的吸引值概率性地沿着边从节点移动到节点，该吸引值考虑了心理和环境因素，并且可能随每个时间步变化。另一个模型，结合了基于力的机制和D*增量图搜索算法，在离散化为单元的地形上控制人群成员的移动。

疏散是人群移动建模中特别有趣的应用。在疏散中，人群移动因社会学或情感因素而变得复杂，特别是恐慌。恐慌的疏散者倾向于专注于即时的个人利益，忽略会限制其移动的社会和文化规范，例如人际距离。恐慌可能会降低人群成员的注意力，导致忽略较近的出口，因此恐慌实际上可能会延迟疏散过程中人群成员的逃生。已经开发了各种疏散相关应用的人群移动模型，包括评估障碍物对疏散效率的影响、分析建筑物火灾期间的疏散、分析恐怖炸弹袭击期间的疏散、分析使用自动扶梯的地铁系统疏散、分析公路隧道疏散，以及分析便于疏散的建筑设计特征。早期用于模拟非疏散人群移动的元胞离散事件仿真环境后来被用于实现一套表示紧急情况下人群成员行为不同方面的疏散模型。模拟了不良视线条件（如同烟雾弥漫的建筑物中可能发现的那样），使用盲目跟随移动规则。基于昆虫群落的生物学启发模型也被用于模拟人群恐慌反应。

逼真的人群移动模型，特别是恐慌移动模型，应该允许因压力和踩踏而造成伤害或死亡的可能性。这种伤亡在疏散中是主要关注的问题，人群模型已被用于专门分析这一风险。游戏中已经存在一些人群模型实现的例子。除了前面提到的模型，人群成员已被整合到Unreal Tournament 2004和Gamestudio A7中。本文中描述的工作与一些早期项目的不同之处在于展示了将基于物理的人群移动模型集成到游戏引擎（Unity）中。在一项密切相关的工作中，本文中使用的相同物理人群移动模型在不同的游戏引擎（Unreal Tournament）中实现。

---

## 3. 人群移动模型

本文使用的基于物理的人群移动模型来自Helbing、Farkas和Vicsek（为简便起见以下简称Helbing模型）。它基于在牛顿力平衡模型中包含社会力。回想一下，在牛顿力和运动模型中，F = ma，其中F是物体上的力，m是物体的质量，a是某一点的速度变化率。作用在人群中的一个人i上的力可以写成等式（1），其中mi是人的质量，a = (dvi/dt)：

$$m_i \frac{dv_i}{dt} = m_i \frac{v_i^0 e^i_0 - v_i(t)}{\tau_i} + \sum_{j \neq i} f_{i,j} + \sum_w f_{i,W}$$

等式（1）右边的第一项与人i在一段时间间隔内的移动有关，其中人的初始速度为v⁰ᵢ，期望方向为e⁰ᵢ。从导数的定义我们知道dvᵢ/dt = lim(△t→0)(△v/△t)。量vᵢ⁰e⁰ᵢ - vᵢ(t)/τᵢ表示人的当前速度和方向vᵢ(t)与人的期望速度和方向vᵢ⁰(t)eᵢ⁰之间在一小段时间间隔内的差异。因此，产物mᵢ(vᵢ⁰eᵢ⁰ - vᵢ(t))/τᵢ表示由于期望运动和当前运动之间的差异而产生的力的离散近似。等式（1）中的项∑_{j≠i} f_{i,j}和∑_w f_{i,W}分别代表与人群其他人以及墙壁和其他障碍物相互作用产生的力。

对于人群中相互作用的每对人i和j：

$$f_{ij} = A_i e^{(r_{ij} - d_{ij})/B_i} n_{ij} + k g(r_{ij} - d_{ij}) n_{ij} + \kappa g(r_{ij} - d_{ij}) \Delta v_{ji} t_{ij}$$

量r_{ij} - d_{ij}在等式（2）中出现三次；r_{ij}是每个人i和j的半径之和；d_{ij}是从i的中心到j中心的距离。如果这个量为正，则两人相互接触或发生了碰撞。

等式（2）右边第一个乘积中的指数由常数Aᵢ和Bᵢ修改。这些常数只与人i相关，与人j无关。Aᵢ和Bᵢ代表人在人群中人i对与他人接近或接触的社会行为。显然，当Aᵢ很大或Bᵢ很小时，等式（2）中第一个乘积的值变得更加重要。随着r_{ij} - d_{ij}的值增加（意味着人i和j越来越接近），指数变得更大，并且一旦r_{ij} - d_{ij}为正（处于碰撞状态）就快速增长。函数g(r_{ij} - d_{ij})在参数为正时等于参数，否则为零。上式中的第二项k g(r_{ij} - d_{ij})表示实际碰撞的力。这种Helbing模型实现用相同大小的力表示人与人之间的所有碰撞。这种抽象似乎不会显著影响本模拟中模型的保真度。在这个实现中，模型进一步简化为假设所有人同样不愿意与他人发生身体接触。

和Aᵢe[(r_{ij} - d_{ij})/Bᵢ] + k g(r_{ij} - d_{ij})乘以向量n_{ij}，这是一个归一化向量，直接从人j的中心指向人i的中心，因此与社会行为和碰撞相关的力是可加的。

等式（2）中的第三项κ g(r_{ij} - d_{ij}) Δv_{ji} t_{ij}与人和j之间的摩擦有关。κ是另一个缩放常数，函数g(r_{ij} - d_{ij})如前所述。向量t_{ij}表示j和i之间的切线方向，通过取n_{ij}的z分量和x分量的负值形成新向量t_{ij} = (-z, y, x)。向量t_{ij}确保摩擦力的方向与人和j之间接触点相切。当与另一个人或物体接触时，摩擦力作用于限制运动，方向与运动相反，与人或物体之间的接触点相切。量Δv_{ji}是一个标量，通过取人i和j的方向向量的差值，并与向量t_{ij}取点积得到。Δv_{ji}也作为一个乘数，缩放碰撞人群之间的摩擦力。

等式（1）中的项∑_w f_{i,W}表示与人i相关的墙壁或其他障碍物作用的力的总和，由以下各项组成：

$$f_{iW} = A_i e^{(r_i - d_{iW})/B_i} n_{iW} + k g(r_i - d_{iW}) n_{iW} + \kappa g(r_i - d_{iW}) v \cdot t_{iW} t_{iW}$$

在计算力f_{iW}时，所有项都与涉及与其他人的力的情况类似，只是涉及摩擦力的项不同；这些项的相似之处在于r_i - d_{iW}表示人到墙W的距离，函数g，常数k和κ是类似的。t_{iW}也类似，因为它表示人与物体接触点处的切线向量。

因为墙不移动，人和物体之间的摩擦计算方式不同，t_{iW}因子类似于t_{ij}。因为物体是静止的，人速度与切线向量t_{iW}的点积取代了等式（2）中的Δv_{ji}。回想一下，Δv_{ji}包括人i和j的速度分量。在与物体碰撞的情况下，物体是静止的，因此标量Δv_{ji}被v·t_{iW}取代，在摩擦项中。这些相互作用力的总和（物理和社会）改变了人在人群中移动的方向。

![图1：Helbing疏散模型产生的拱形结构示例](图1)

使用Helbing模型的疏散模拟通常会产生类似于图1所示的人群成员配置。疏散的人群聚集在单个出口周围，形成半圆形簇，通常称为"拱形"。在非恐慌状态下，人群成员遵守社会人际距离约束并安全疏散。在恐慌状态下，人群成员可能会相互推搡，与期望方向和速度相关的力主导了鼓励人群成员避免接触的社会力。因此，人群成员被挤压在一起，并靠近墙壁和其他障碍物。

---

## 4. 实现

本节详细介绍了使用Unity游戏引擎实现人群移动模型以及模拟人群移动的虚拟世界。强调了非恐慌和恐慌疏散场景之间的差异。本节还描述了所实现模型的功能测试。

初始实现使用了一个简单的疏散场景，作为疏散研究的便捷基线（用于验证的更现实场景在第5节中描述）。在简单场景中，占据单个矩形房间的人群成员通过单个出口疏散。人群成员的实现使得它们可以在场景执行开始时分布在整个房间中。一旦生成，人群成员通过出口移动到房间外的位置。人群移动模型包括非恐慌和恐慌版本的Helbing模型；后者包括第3节中描述的额外人群力项。

### 4.1 Unity场景

基本疏散场景（房间、出口、人群成员以及非恐慌或恐慌的人群状态）被实现为一个Unity场景。从空场景开始，通过添加一个平面并将其定位使其长边的中心放在场景原点来创建地面。然后通过转换四个立方体对象并将其放置在平面周围来构造墙壁。地面和墙壁被设置为碰撞体对象。Unity中的碰撞体对象使对象实体化，以便其他对象不能穿过它。使用Unity中可用的材质功能添加视觉逼真感，可以应用于环境中对象的表面。地面使用基本泥土材质，墙壁使用砖砌材质。天空盒中添加了云。

图2显示了为人群模拟环境实现的房间的俯视图。房间宽100个单位，深50个单位，墙高8个单位。Unity中的物理世界使用标准3D笛卡尔坐标映射，表示为(x, y, z)，其中x和z表示包含地面的平面，y是上下维度。图中标记为O的点是场景中坐标系的原点(0,0,0)。原点对面墙壁中心的2个单位宽的开口是人群成员用来疏散房间的出口。这个目标出口点在图中标记为T，位于(0,0,-49)。

为了使对象能够像现实生活中一样在场景中交互，碰撞体必须作为子对象附加到场景中的父对象上。碰撞体对象的使用和行为是Unity游戏引擎物理建模的基础。碰撞体使游戏引擎能够检测其父对象之间的碰撞。静止对象，如墙壁、岩石、树木，甚至地面平面都必须是碰撞体对象的父对象。没有碰撞体对象，场景中的对象会穿过地面或相互穿过而没有效果，产生不切实际的行为。地面平面和墙壁每个都添加了RigidBody碰撞体作为子对象。在Unity中，RigidBody碰撞体对象具有事件处理方法，可以在发生碰撞时调用以执行特定操作。

### 4.2 人群成员

为了实现人群成员，我们从Unity Asset Store下载了一个名为Relaxed Man Character的Unity资源，由Vu Studios开发。这个资源是一个Unity预制体对象的示例，已创建为可在各种游戏或项目中实例化的模板。Relaxed Man预制体提供了人群成员所需的许多特征，包括一个完全绑定的人体模型。Relaxed Man提供三种动画选项：Walk 1、Walk 2和Run。Walk 1被修改用于非恐慌场景，Run用于恐慌场景。两种步行动画没有提供所需的平滑运动，因此需要对动画参数进行一些修改。Relaxed Man的默认物理特征也被修改，包括修改角色的质量和子胶囊的大小和直径。测试这些修改后，修改后的角色被保存为自定义预制体。然后可以在场景中的多个位置实例化它以创建人群。由此产生的定制版本被称为Crowd Guy。Relaxed Man和Crowd Guy都是对象类。图3（左）显示了简单疏散场景中Crowd Guy的实例。

虽然场景中的静态对象（如墙壁和地面）使用基于物理的RigidBody控制器，但对于人形对象来说，使用另一种称为CharacterController的控制器更好。CharacterController相对于RigidBody控制器的优势在于管理Crowd Guy实例的移动。包括攀爬物体在内的正常运动和动画可以在CharacterController中以更自然的方式实现。一般来说，CharacterController是在Unity中实现玩家或人形非玩家角色推荐的方法。

当创建CharacterController时，默认会创建并附加一个Capsule Collider。Capsule Collider是一个胶囊形状的碰撞体对象，可用于人形资产（本例中的人群成员）。图3（右）显示了一个带有CharacterController的Crowd Guy，展示了Capsule Collider组件。该图还显示了Crowd Guy腹部旁边的一个立方体，有三个箭头从立方体发出。这个立方体以(0,0,0)点为中心，相对于Crowd Guy的原点。一组子数据元素，称为transform，在场景中定位角色。正如前面解释的，场景中有一个点是场景的原点。场景中的每个Crowd Guy都有一个相对于场景原点的x、y和z分量位置，以及允许角色在场景中正确定向的旋转。

与CharacterController一起实现的Capsule Collider优于网格碰撞体，出于性能原因。虽然可以（并且从查看碰撞的角度可能更逼真）基于完全网格化的人形角色实现碰撞体，但计算开销巨大。此外，使用Capsule Collider而不是网格碰撞体不会显著影响模型的逼真度。

在非恐慌场景中，CharacterController的运动由Unity AI引擎通过使用NavMesh代理扩展CharacterController来管理。NavMesh代理促进Crowd Guy在场景中移动而不与物体或其他Crowd Guy碰撞。这是NavMesh代理的目的。在恐慌场景中，Crowd Guy不使用NavMesh代理，而是通过自定义脚本实现Helbing模型。

Crowd Guy对象类的多个实例（或用Unity术语说是"克隆"）在房间内实例化以创建人群。模拟被实现为可以运行不同的人群规模。通过在房间的每一半上覆盖规则的正方形网格，然后在网格的一部分内随机放置克隆来实现克隆的初始分布。这使得克隆的分布比将它们放置在完全规则的网格上更逼真。创建时，每个克隆都会转向房间的单个出口并开始向该方向移动。

### 4.3 疏散场景

如前所述，非恐慌和恐慌两种疏散场景都被模拟了。实现人群成员移动的方法在场景之间有所不同。非恐慌人群的实现同时使用Unity物理引擎和Unity AI引擎（以后者的形式——Unity导航网格）。恐慌人群的实现只使用Unity物理引擎；人群行为完全基于自定义脚本。

当然，恐慌和非恐慌人群以及场景也可以使用单个集成脚本实现。然而，Unity AI引擎的"黑箱"性质使这种实现变得有问题，因此我们的实现由恐慌和非恐慌人群的单独脚本组成。这种实现的第二个好处是简化了为每个场景调整模型参数的过程。组合恐慌和非恐慌模块的工作留待将来完成。

#### 4.3.1 非恐慌疏散

场景的实例化（即房间和出口）在非恐慌和恐慌版本中相似，但在人群成员的实现上存在一些差异。当人群不恐慌时，第3节中讨论的涉及可接受社会距离的力作用于克隆，但不发生身体力和摩擦力，因为通常不会发生碰撞。这些物理力在Helbing模型中为零。因此，非恐慌场景的Crowd Guy预制体显示了与恐慌场景不同的配置。

差异之一是非恐慌Crowd Guy克隆使用Unity导航来规划通过出口的路径，同时避免路径上的物体或其他克隆。通过使克隆避免路径上的物体，Unity导航提供了模拟人群社会力所必需的功能。为了在非恐慌场景中使用Unity导航，创建了导航网格（NavMesh）。NavMesh是一个简化的几何结构，由场景中所有静止对象组成。然后为每个克隆添加NavMesh组件或代理；它使他们能够围绕NavMesh中的各种障碍物规划路径。

非恐慌场景使用NavMesh来利用Unity AI引擎。虽然NavMesh可以在一定程度上调整，但它不允许达到先前工作中展示的模拟结果的粒度水平。然而，选择NavMesh大大简化了非恐慌场景的实现，并且只需要有限的校准就能产生逼真的结果。

代码摘录1显示了非恐慌场景的MoveTo方法。第6-10行声明并初始化了NavMesh代理。第15-16行找到名为Spawn Crowd NP的实例化预制体的NavMesh代理。第17-23行处理未找到代理的情况。第27-29行建立目标并指示克隆向目标移动。目标位置设置为(0,0,-300)，这是距离房间很远的距离。这是必要的，以便克隆可以离开而不会阻塞其他仍在试图逃离房间的克隆的出口。使用NavMesh确保克隆可以找到目标并避开障碍物和其他克隆。第30行将克隆的健康值初始化为500单位。

随着模拟运行，另一个脚本Update每帧调用一次。在每次更新时，评估克隆的位置。当克隆到达z=-50时，认为它已经逃离了房间。

一个事件处理程序OnCollisionEnter，当克隆与场景中的另一个克隆或物体发生碰撞时被调用。OnCollisionEnter递减克隆的健康值。如果健康值为零或更低，克隆被标记为死亡，并更新死亡人数统计。然而，在非恐慌场景中，正如预期的那样，没有记录到碰撞。

图4显示了非恐慌场景执行的俯视图。人群正在形成围绕出口的特征性拱形，类似于图1中 earlier所示。图5从另一个角度显示了相同的非恐慌场景。通过这样做，非恐慌模拟可以被认为是满足了定性表面验证。

#### 4.3.2 恐慌疏散

恐慌场景的实现与非恐慌场景在几个方面不同。值得注意的是，克隆移动得更快，而且移动不像非恐慌场景那样通过NavMesh代理由Unity AI引擎促进。

如前所述，当恐慌发生时，社会力被添加到与其他人群成员碰撞的物理力中。克隆被编写脚本移动到目标(0,0,-49)，就在房间内（参见图2），然后转身穿过门，此时被认为已经逃离。

代码摘录2显示了恐慌场景的Update方法，每帧执行一次。Update的非恐慌和恐慌版本的不同之处在于它们附加到不同类别的对象，并实现了模拟人群恐慌所需的物理力。在恐慌场景中，Update是CharacterController对象的脚本组件，而在非恐慌场景中，Update是NavMesh代理的组件。因为NavMesh代理提供了非恐慌情况下适当的社会距离，其缺失在恐慌场景中更准确地模拟了恐慌人群。

代码摘录2表示等式(1)中与相对于当前方向的期望方向运动相关的部分。第2行获取连接到克隆的CharacterController的对象引用。第3-6行测试克隆是否已经逃离，如果是，则继续当前方向的移动并返回。如果克隆尚未逃离，第8-10行计算从指定在(0,0,-49)的出口目标到克隆当前位置的距离。第12-15行指示角色转向目标。第18-24行创建指向目标的归一化方向向量。第26-29行检查克隆是否在当前更新期间逃离，如果是则增加逃离计数。第31-39行如果达到(z<-49)，则使克隆转身穿过门口，并继续沿该方向移动。方向上使用随机元素，以便克隆在超越目标后不会聚集在一起。第41行使用SimpleMove方法将克隆移动到目标并超越。SimpleMove忽略方向向量的y分量，并按速度变量成比例地移动克隆。

在代码摘录3中，OnControllerColliderHit方法是一个事件处理程序，每当CharacterController检测到碰撞时都会运行。它实现了等式(1)和(2)中分别关于与人或物体碰撞时受到的力的分量。第2行找到与克隆碰撞的碰撞体，第5行调用takeDamage方法来记录与克隆碰撞的角色受到的伤害。第14-21行计算3元素向量dv的值，该向量表示由于碰撞而施加在一个人身上的力的差异。这些计算与基于碰撞改变人群成员方向的Helbing模型一致。

在takeDamage方法中，验证克隆尚未逃离后，克隆的健康值递减。如果角色健康为负，则确定角色在模拟中死亡，并被替换为倒地的Ragdoll。更新碰撞、死亡和逃离的计数器。

代码摘录4显示了addColl和updateDisplay方法。第1-13行是addColl方法，更新碰撞计数，必要时更新死亡计数。如果克隆死亡，则创建一个新的位置向量，等于作为参数传递给addColl的死亡游戏对象的位置。在第10行，一个新的预制体在死亡角色的位置被实例化。这个新角色是一个名为Ragdoll的Unity对象，会立即倒地。Ragdoll包含具有绑定角色每个部分的RigidBody碰撞体，并将与CharacterController碰撞，因此它们成为场景中的障碍物，因此剩余的克隆必须绕过或攀爬它们。

图6显示了恐慌场景的俯视图。人群正在以与非恐慌场景类似的方式围绕出口形成半圆形拱形。与非恐慌版本不同，克隆彼此、墙壁和出口非常紧密地挤在一起。可以看到，虽然克隆正在逃离，但它们在出口外的物理分散程度比非恐慌场景（图4）中更大，因为每个时间段逃离的人更少。图7显示了同一场景从另一个角度的另一次运行。这显示了倒地的死亡克隆和试图爬过它们逃生的存活克隆。

### 4.4 功能测试

功能测试的目标是评估模型实现的正确性，并确认与预期一致的定性合理结果。使用已经描述的基本疏散场景（具有单个出口的简单矩形房间）进行此测试。使用了五种不同的人群规模（50、100、150、200和250），并测试了非恐慌和恐慌两种场景。场景在不同人群规模和场景之间没有改变。模拟对每种人群规模和场景组合执行了五次。图5和6来自200人非恐慌人群的一次执行，图6和7来自200人恐慌人群的一次执行。表1总结了模拟的定量结果。该表显示了每种人群规模和场景组合的疏散时间、碰撞次数、死亡人数和逃离人数的平均值。疏散时间是最后一个人群成员离开房间或死亡的时间。

非恐慌场景产生了有序的人群向出口移动。出口变得拥挤，但个人群成员能够相对有效地通过，不会对彼此造成任何伤害。因为人群成员使用Unity导航实现，非恐慌人群成员保持了社会距离，因此在任何人群规模的所有非恐慌执行中都没有发生碰撞或死亡。

在恐慌场景中，人群成员比非恐慌状态移动得更快。结果，出口更快堵塞。由于恐慌和拥堵，人群成员在试图到达和穿过出口时开始相互推搡。这导致发生了一些碰撞，几个人群成员受到足够的伤害导致死亡。碰撞和死亡人数随人群规模增加。未死亡的人群成员必须爬过死亡的人群成员，进一步减缓他们的逃离。人群成员的逃离速度是不规则的，这与Helbing模型的其他实现一致。

两种场景都产生了与我们预期一致的结果，这些预期来自使用Helbing模型的其他模拟和我们之前的工作。在模拟过程中，疏散的人群成员在出口门周围形成了逼真的拱形结构，这构成了模型的非正式定性表面验证。这些模拟还表明，当人群不恐慌时，疏散可以无伤害地进行，这与文献一致。

---

## 5. 验证

功能测试成功完成后，基于具有更复杂场景的实际人群疏散事件进行了定量校准和验证。通过重新创建并将其结果与实际事件比较来验证模型是一种有效的验证方法，称为预测验证或回溯预测；它经常（但当然不是唯一）用于战斗模型。本节报告了定量验证模型的过程和结果。

### 5.1 验证事件

用于模型验证的事件是2003年2月20日在罗得岛州西沃里克市的Station夜总会发生的火灾期间的恐慌疏散。选择此事件验证模型是因为可用的数据量、这些数据的细节以及该数据的权威来源。该事件至少在之前已被用于模型验证，但每次方式不同。

在实际事件中，在拥挤的夜总会内现场音乐会开始时使用的烟火点燃了墙壁中的聚氨酯泡沫隔热材料，引发了火灾，迅速引发了恐慌性疏散。巧合的是，火灾当晚，当地电视台的一名摄像师正在夜总会录制一份关于夜总会过度拥挤的报告；该报告的动机是三天前在芝加哥另一家夜总会发生的致命踩踏事件。摄像师能够安全疏散，从夜总会内外拍摄了火灾和疏散过程。该视频和后续调查记录了疏散时间线和事件（如火灾点燃、特定个人出口、前门附近的堵塞、应急人员的响应）、人群密度的估计，以及关于逃离人数和他们使用的出口的详细信息。

据报道，火灾发生时夜总会内的人数分别为458人和462人。本研究使用了458人。火灾共造成100人死亡，96人在事件中死亡，4人因事件中受伤后来死亡。死亡原因包括火灾本身（烧伤和烟雾吸入）以及恐慌人群产生的挤压力量。恐慌人群的挤压阻碍了一些人群成员在浓烟吞噬之前安全出口的能力。许多人在从最初点燃到逃离的时间不到90秒。恐慌性疏散直到点燃后约30秒才开始；起初，一些人短暂地认为火灾是音乐会烟花的故意组成部分。

建筑有四个不同的门；所有这些门以及两个不同的窗户都被用来逃离建筑。然而，其中一个门（平台出口）靠近初始点燃位置，只能在火灾的前30秒内进入，另一个门（厨房出口）大多数人不知道，因此没有多少人使用它逃离。

### 5.2 场景实现

Station夜总会建筑和疏散在Unity中重新创建。为此，需要复制建筑布局，在建筑内的适当位置实例化正确数量的人群成员，并以与实际疏散中使用的出口比例一致的比例为每个人群成员分配出口。

图8显示了夜总会的平面图，图9显示了Unity实现。一些墙壁和用于存储和办公空间的小房间没有实现以简化；省略的房间不在疏散路线上，不影响人群成员的逃离时间。

对于每次模拟执行，在夜总会的主房间内为人群成员创建生成点。修改了Spawn Crowd脚本以支持在夜总会墙壁内生成新的人群成员生成点。在代表夜总会主房间边界x和z区间内生成两个均匀分布的随机变量。这些随机变量然后用作Crowd Guy克隆的初始位置。该过程对每个人群成员重复。

在代码摘录5中，每个克隆被随机分配六个出口之一，克隆将尝试通过该出口离开夜总会。出口分配过程不代表应急响应者管理疏散；相反，它代表了事件中每个人群成员做出的个人出口选择决策。研究表明，在恐慌性疏散中，人群成员更倾向于通过他们最熟悉的门离开。在不熟悉的建筑中，最有可能是他们进入建筑时使用的同一个门，这就解释了与主门相关联的相对较大概率。

夜总会的主房间被分成两个区域，以便克隆被分配到接近其初始位置的出口。右侧区域的克隆（相对于图8和9）被随机分配通过平台出口门、左窗或主门离开。左侧区域的克隆被随机分配通过主门、右窗、酒吧门或厨房门离开。给定克隆被分配到特定出口的概率与实际疏散中通过该门或窗户逃离的人群成员数量成比例。因为分配是随机的，每次运行之间分配的出口和分配给每个出口的人群成员总数会有变化。

当模拟执行时，脚本检查克隆是否由于内部墙壁而逃离，克隆必须从其初始生成点被路由到分配的出口点。这是通过基于克隆的初始位置创建中间目标点来实现的。

图10显示了夜总会疏散模拟执行的一次俯视图。疏散的克隆已经形成了围绕主出口的预期半圆形拱形。一些克隆根据分配的出口通过其他门或窗户离开。图11显示了同一模拟，但稍后从另一个角度。图12显示了模拟结束；死亡克隆在主出口门附近。

### 5.3 校准

模型校准是将模型及其结果与所建模的真实世界系统进行迭代比较并修改模型以提高其准确性的过程。当在夜总会场景上测试时，模型最初产生了不切实际的高数量碰撞和死亡。校准是必要的，以使模型的结果与实际事件保持一致。

模型通过迭代调整两个克隆的参数进行校准：移动速度和初始健康值。移动速度参数决定了克隆向分配出口移动的速度，除非因拥堵而减慢。健康参数决定了与其他克隆的多少次碰撞会导致克隆死亡。

模型被执行，参数值被调整以找到既产生与实际疏散一致的结果又在物理上逼真的值。在校准过程早期，所有克隆的速度和健康参数值相同。参数值一致时，挤压导致的死亡人数比火灾和烟雾吸入导致的死亡人数高得不合实际。在校准过程后期，使用正态分布为每个克隆随机生成不同的速度和健康值。使用因人群成员而异的健康参数值导致挤压死亡人数和烟雾吸入死亡人数相当，更逼真。产生与实际事件最匹配结果的参数值是一致的速度和正态分布的健康值。

最终，校准调整速度和健康值导致模拟中的总死亡人数接近实际事件中发生的100人。如前所述，人群成员在点燃后约90秒内逃离，然后在夜总会内死于火灾和烟雾，实际疏散在火灾开始后约30秒才开始。验证运行从疏散开始的时刻开始，因此在模拟中，60秒后仍在建筑内的人被假定为死于火灾和烟雾吸入。

### 5.4 验证结果

在找到速度、健康值和出口分配概率的最佳值后，模型被验证。由于模型中存在随机性，包括生成点位置、健康值和每个人群成员的出口分配，模拟结果每次运行都有变化。因此，在验证过程中，夜总会疏散模拟被执行了30次。记录了每次运行的结果，包括踩踏死亡、火灾和烟雾死亡、总死亡和总逃离。重要的是，在校准过程中设置的参数值随后没有被调整；在验证过程中没有对模型或其参数进行任何更改。

表2详细列出了30次验证执行的结果。"Crowding deaths"列显示因与其他人群成员碰撞而死亡的人数，"Fire and smoke deaths"列显示60秒后仍在建筑内因此被假定为死于火灾或烟雾吸入的人数，"Total deaths"列是两种死亡人数的总和。"Escaped"列是能够离开建筑的人群成员人数。

置信区间用于定量评估验证运行的结果。置信区间通常用于模型验证，当随机模型多次运行的结果与单个实际事件进行比较时，或者当对物理现象的多次测量受不确定性或测量误差影响与确定性模型的单次运行结果进行比较时。人群移动模型是随机的，使用了一个事件进行验证，因此前者适用。验证中考虑的反应变量是Total deaths和Escaped。模型被执行30次，并记录反应变量的值。除了这些反应变量的均值、标准差、最小值和最大值外，还使用Student t分布计算了95%置信水平的置信区间。表3详细列出了这些计算的结果。如表所示，Total deaths的置信区间为[96.11,106.89]，包含实际事件值100；Escaped的置信区间为[351.11,361.89]，也包含实际事件值358。因此，该模型被认为是有效的反应变量。

可以说，Total deaths和Escaped这两个反应变量实际上是一个反应变量的两个互补视图，因为Total deaths和Escaped总是加起来等于458，即夜总会中初始的人群成员人数。从这个角度来看，该模型针对一个反应变量（尽管是重要的一个）进行了验证，使用了适当的置信区间。

---

## 6. 研究结果与未来工作

本文详细描述了如何在Unity游戏引擎中实现基于物理的人群移动模型。Unity包含用于2D和3D图形生成的渲染引擎以及包含碰撞检测功能的物理引擎。与使用高级编程语言实现相同模型和场景所需的工作量相比，在Unity中创建可用真实或想象世界的3D表示相对容易。

所实现的建模结果与先前实现此类模型的努力一致。文献中发现的人群疏散的关键特征，如出口周围拱形的形成，在基于Unity的模型中得到了适当复制。总体而言，该实现表明，在这种配置下，Unity游戏引擎可用于以相当简单但有用的逼真方式模拟人群移动，因此可能成为对人群评估建模感兴趣的研究人员的可行工具。

此外，使用Station夜总会事件对模型进行定量验证表明，至少对于与夜总会类似的建筑配置（小建筑物，有限的出口和单一危险点），基于Unity的人群疏散模型可以被验证为准确的。他们还展示了用于此类模型的验证过程。

这项工作可以通过多种方式扩展和增强：

- 执行人群规模增加的模拟，以探索游戏引擎的计算极限。
- 不仅使用Helbing模型来确定人群成员的碰撞后方向（如当前实现），还使用其人群压力计算来确定每次碰撞的损害程度。在更新人群成员健康时考虑相对损害。
- 模拟非直接移动，即由于障碍物、视线不良或拥堵，人群成员沿着除直接路线外的路径到达分配的出口。
- 模拟人群成员如果在被阻止到达所选出口的途中改变其出口选择决策到另一个出口。
- 允许不同的人群成员加速度和速度参数，以反映个人对感知人群拥堵的响应以及多次非致命碰撞的累积损害影响。
- 模拟每个人群成员根据其对情况的感知从非恐慌状态到恐慌状态的个别转变，导致并非所有人群成员同时恐慌并开始疏散的模拟。
- 将恐慌和非恐慌人群的实现组合成集成脚本。
- 使用额外的历史人群疏散事件验证模型，包括与所用事件不同的情形（更大的建筑、更多的出口和/或多个危险点）。

---

## 参考文献

[1] Farkas I., Helbing D., Molnar P., Vicsek T., Simulation of pedestrian crowds in normal and evacuation situations, Pedest. Evac. Dyn. 21(2):21-58, 2002.

[2] Thalmann D., Musse S., Crowd Simulation, Springer-Verlag, London, 2007.

[3] Pelechano N., Allbeck J., Badler N., Virtual Crowds: Methods, Simulation, and Control, Morgan and Claypool, San Rafael, 2008.

[4] Loftin R., Petty M., McKenzie F., Gaskins R., Modeling crowd behavior for military simulation applications, in Rouse W., Boff K.(eds.), Organizational Simulation. John Wiley and Sons, New York, pp.471-536, 2005.

[5] McKenzie F. D., Petty M. D., Kruszewski P. A., Gaskins R. C., Nguyen Q.-A., Seevinck J., Weisel E. W., Integrating crowd-behavior modeling into military simulation using game technology, Simul. Gaming 39(1):10-38, 2008.

[6] O' Sullivan C., Cassell J., Vilhjálmsson H., Dingliana J., Dobbyn S., McNamee B., Peters C., Giang T., Levels of detail for crowds and groups, Comput. Grap. Forum 21(4):733-741, 2002.

[7] Reynolds W., Flocks, herds, and schools: A distributed behavioral model, ACM SIGGRAPH, Proc. Fourteenth Annual Conf. Computer Graphics and Interactive Techniques, Anaheim California USA, ACM, New York, pp.27-31, 1987.

[8] Fillippdis L., Galea E., Gwynne S., Lawrence P., Representing the influence of signage on evacuation behavior within an evacuation model, J. Fire Prot. Eng. 16(1):37-73, 2006.

[9] Bandini S., Manzoni S., Situated cellular agents for crowd simulation and visualization, Cybern. Syst. Int. J. 38(7):729-753, 2007.

[10] Brogan D., Hodgins J., Group behaviors for systems with significant dynamics, Auton. Robots 4(1):137-153, 1997.

[11] Pelechano N., Allbeck J., Badler N., Controlling individual agents in high-density crowd simulation, ACM SIGGRAPH, Proc. 2007 ACM SIGGRAPH/Eurographics Symp. Computer Animation, pp.99-108, San Diego, Eurographics, Aire-la-Ville, 2007.

[12] Brenner M., Wijermans A., Nussle T., de Boer B., Simulating and controlling civilian crowds in robocup rescue, https://www.semanticscholar.org/paper/Simulating-and-Controlling-Civilian-Crowds-in-Brenner-Wijermans/891b8d457218cf6d81b49d328c1a2be5608b123c, 2005.

[13] Sornum K., Liang Y., Cai W., Low M., Zhou S., 3D visualization and animation of crowd simulation using a game engine, GSTF, Proc. 2009 Computer Games, Multimedia, and Allied Technologies Conf. GSTF, Singapore, 2009.

[14] Braun A., Musse S. R., de Oliveira L. P., Bodmann B. E., Modeling individual behaviors in crowd simulation, 16th Int. Conf. Computer Animation and Social Agents, IEEE, New Brunswick, NJ, USA, pp.143-148, 2003.

[15] Papelis Y. E., Kady R. E., Bair L. J., Weisel E. W., Modeling of human behavior in crowds using a cognitive feedback approach, SIMULATION: Trans. Soc. Model. Simul. Int. 93(7):567-578, 2017.

[16] Helbing D., Farkas I. J., Molnár P., Vicsek T., Simulation of pedestrian crowds in normal and evaluation situations, in Schreckenberg M., Sharma S. D.(eds.), Pedestrian and Evacuation Dynamics, Springer, New York, 21-58, 2002.

[17] Keating J. P., The myth of panic. Fire J. 76(3):57-61, 1982.

[18] Elliot D., Smith D., Football stadia disasters in the United Kingdom: Learning from tragedy? Org. Environ. 7(3):205-229, 1993.

[19] Jia X., Yue H., Tian X., Yin H., Simulation of pedestrian flow with evading and surpassing behavior in a walking passageway, SIMULATION: Trans. Soc. Model. Simul. Int. 93(12):1013-1035, 2017.

[20] Niu L., Song Y., A simulation model fusing space and agent for indoor dynamic fire evacuation analysis, SIMULATION: Trans. Soc. Model. Simul. Int. 92(8):215-232, 2016.

[21] Shendarkar A., Vasudevan K., Lee S., Son Y., Crowd simulation for emergency response using BDI agents based on immersive virtual reality, Simul. Model. Pract. Theory 16(9):1415-1429, 2008.

[22] Kinsey M. J., Galea E. R., Lawrence P. J., Modelling evacuation using escalators: A London underground dataset, in Weidmann U., Kirsch U., Schreckener M.(eds.), Pedestrian and Evacuation Dynamics 2012, Springer, Cham Switzerland, 385-399, 2014.

[23] Ronchi E., Fahy R., Colonna P., Berloco N., Validation and calibration of the EXIT89 evacuation model for road tunnel evacuation applications, in Weidmann U., Kirsch U., Schreckener M.(eds.), Pedestrian and Evacuation Dynamics 2012, Springer, Cham Switzerland, pp.543-550, 2014.

[24] Hu M., A high-fidelity three-dimensional simulation method for evaluating passenger flow organization and facility layout at metro stations, SIMULATION: Trans. Soc. Model. Simul. Int. 93(10):841-851, 2017.

[25] Al-Habashna A., Wainer G., Modeling pedestrian behavior with Dell-DEVS: Theory and applications, SIMULATION: Trans. Soc. Model. Simul. Int. 92(2):117-139, 2016.

[26] Jafer S., Lawler R., Emergency crowd evacuation modeling and simulation framework with cellular discrete event systems, SIMULATION: Trans. Soc. Model. Simul. Int. 92(8):795-817, 2016.

[27] Yue H., Wang S., Jia X., Shao C., Simulation of pedestrian evacuation with blind herd mentality under adverse sight conditions, SIMULATION: Trans. Soc. Model. Simul. Int. 92(6):491-506, 2016.

[28] Bonabeau E., Dorigo M., Theraulaz G., Swarm Intelligence: From Natural to Artificial Systems, Oxford University Press, New York, 1999.

[29] Banarjee S., Grosan C., Abraham A., Emotional ant based modeling of crowd dynamics, Proc. Seventh Int. Symp. Symbolic and Numeric Algorithms for Scientific Computing, IEEE Computer Society, Timisoara Romania, pp.25-29, 2005.

[30] Lee R., Hughes R., Minimisation of the risk of trampling in a crowd, Math. Comp. Simul. 74(1):29-37, 2007.

[31] Low M., Cai W., Zhou S., A federated agent-based crowd simulation architecture, in Zelinka I.(ed.), Proceedings of the 2007 European Conference on Modeling and Simulation, Prague Czech Republic, Digitaldruck Pirrot, Dudweiler, pp.188-194, 2007.

[32] Bott M., Petty M., Implementing a physics based model of crowd movement using unreal development kit, J. Gaming Virtual Worlds 6(3):275-296, 2014.

[33] Helbing D., Farkas I., Vicsek T., Simulating dynamical features of escape panic, Nature 407:487-490, 2000.

[34] Unity Technologies, Unity Manual, https://docs.unity3d.com/Manual/index.html, 2016.

[35] Vu Studios, Relaxed Man Character, https://www.assetstore.unity3d.com/en/#!/content/32665, 2015.

[36] Petty M. D., Verification, validation, and accreditation, in Sokolowski J. M., Banks C. M., Modeling and Simulation Fundamentals: Theoretical Underpinnings and Practical Domains, John Wiley and Sons, Inc., Hoboken, NJ, pp.325-372, 2010.

[37] Balci O., Verification, validation, and testing, in Banks, J.(ed.), Handbook of Simulation: Principles, Methodology, Advances, Applications, and Practice, John Wiley and Sons, New York, pp.335-393, 1998.

[38] Barbosa S. E., Petty M. D., A survey and comparison of past instances of combat model validation by retrodiction, Proc. Spring 2010 Simulation Interoperability Workshop, SISO (Simulation Interoperability Standards Organization), Orlando FL, April 12-16, 2010.

[39] Grosshandler W., Bryner N., Madrzykowski D., Kuntz K., Report of the Technical Investigation of The Station Nightclub Fire, Vol.1, National Institute of Standards and Technology, Washington, DC, 2005.

[40] Pan X., Computational Modeling of Human and Social Behaviors for Emergency Egress Analysis, Ph. D. Dissertation, Stanford University, June 2006.

[41] Wilgoren J., 21 Die in Stampede of 1,500 at Chicago Nightclub, New York Times, February 18, 2003.

[42] Parker P. E., Tally of a tragedy: 462 were in the station on night of fire, Providence J. 2007.

[43] Bryner N., Madrzykowski D., Grosshandler W., Reconstructing the station nightclub fire: Computer modeling of the fire growth and spread, Interflam 2007, International Interflam Conf. 11th Proc., NIST, September 3-5, pp.1181-1192, 2007.

[44] Graham T. L., Roberts D. J., Qualitative overview of some important factors affecting the egress of people in hotel fires, Int. J. Hospitality Manage. 19(1):79-87, 2000.

[45] Alp N. C., Çagdaş G., Occupants emergency behavior in Turkey, in Weidmann U., Kirsch U., Schreckener M.(eds.), Pedestrian and Evacuation Dynamics 2012, Springer, Cham Switzerland, pp.1123-1133, 2012.

[46] Sagun A., Anumba C. J., Bouchlaghem D., Designing buildings to cope with emergencies: Findings from case studies on exit preferences, Buildings 3(2):442-461, 2013.

[47] Banks J., Carson J. S., Nelson B. L., Nicol D. M., Discrete-Event System Simulation, Fifth Edition, Prentice Hall, Upper Saddle River NJ, 2010.

[48] Petty M. D., Calculating and using confidence intervals for model validation, Proc. Fall 2012 Simulation Interoperability Workshop, SISO, Orlando FL, pp.37-45, September 10-14, 2012.

[49] Petty M. D., Advanced topics in calculating and using confidence intervals for model validation, Proc. Spring 2013 Simulation Interoperability Workshop, SISO, San Diego, CA, pp.194-204, April 8-12, 2013.

[50] Oberkampf W. L., Roy C. J., Verification and Validation in Scientific Computing, Cambridge University Press, Cambridge, UK, 2010.

[51] Brase C. H., Brase C. P., Understandable Statistics: Concepts and Methods, 11th edn., Cengage Learning, Stamford CT, 2015.

---

*通讯作者
