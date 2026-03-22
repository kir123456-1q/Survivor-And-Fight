# 外文翻译（一）

## 英文原文出处
[1] Walter Alan Cantrell, Mikel D. Petty, Samantha L. Knight, Whitney K. Schueler. Physics-based modeling of crowd evacuation in the Unity game engine[J]. International Journal of Modeling, Simulation, and Scientific Computing, 2018, 9(4): 1850029.

---

## 摘要

人群在封闭或受限空间中十分常见。疏散通常可以有序进行，但真实或感知到的危险可能引发恐慌。在恐慌人群中，人际距离通常会被人群成员相互推挤的物理压力所淹没。这种压力既能减缓疏散速度，也可能导致伤亡。为研究各类情况下的人群疏散问题，研究人员已开发出多种模型。本文介绍了使用商业计算机游戏引擎Unity实现、测试和验证人群疏散模型的过程。我们在Unity中实现了一个现实的、基于物理的人群移动模型，该模型计算并考虑了人群成员之间的物理压力。该模型在非恐慌和恐慌两种场景下进行了测试，表现出已知的定性特征。随后，我们通过将模型结果与实际疏散事件——2003年罗得岛州Station夜总会火灾的结果进行比较，对模型进行了定量验证。实现和验证结果表明，Unity可以成为疏散建模的有效工具。

**关键词**：人群建模；人群移动；疏散建模；游戏引擎；Unity

---

## 1. 引言

在现代社会，人群经常聚集在封闭或受限的空间中。这可能发生在许多情况下，包括体育赛事、音乐会、政治集会和宗教活动。尽管这些情况下的人群通常保持冷静，但人群中的恐慌可能由真实和感知到的威胁引发，如看到火焰、闻到胡椒喷雾的味道，甚至只是看到有人奔跑。在恐慌情况下，人群从密闭空间疏散可能很危险，甚至可能致命。恐慌的人群成员可能会踩踏或相互推挤足够大的力量，导致因踩踏或挤压而造成的伤亡。人群多次恐慌，有时毫无理由，导致悲剧性后果。

本文的预期范围并不像人群移动或人群疏散那样广泛。相反，本文主要关注两个贡献。首先，详细描述了如何在计算机游戏引擎（特别是Unity）中实现基于物理的人群移动模型，而不是使用模拟平台或通用编程语言。其目的是使人群建模研究人员能够使用游戏引擎作为开发和测试人群移动模型的环境，并帮助计算机游戏开发者实现物理上真实的人群移动模型。为此，本文以足够的细节呈现了基于Unity的实现，以促进类似的实现。其次，报告了基于实际人群疏散事件对所实现模型的定量验证，以表明此类模型可以具有真实的准确性，并展示验证过程。

选择Unity游戏引擎作为实现环境，是因为与其他环境或高级编程语言相比，创建三维（3D）现实表示的现实或想象世界相对容易。Unity是一款常用于开发视频游戏的跨平台游戏引擎。游戏引擎通常包含用于2D或3D图形生成的渲染引擎，以及包含碰撞检测功能的物理引擎。这些属性对于开发人群模型特别有用。Unity也可供学生免费使用，并且有大量资源可供下载。

本文组织如下：第2节简要回顾相关工作。第3节解释基于物理的人群移动模型。第4节详细介绍了使用Unity游戏引擎实现人群移动模型和模拟人群移动的虚拟世界，包括非恐慌和恐慌疏散之间的差异。本节还描述了对实现模型的定性功能测试。第5节报告了使用实际人群疏散事件对实现模型的定量验证。最后，第6节报告了本论文的发现和未来工作建议。

---

## 2. 相关工作

人群建模主题的研究文献范围广泛且数量众多，全面调查超出了本文的范围。相反，我们呈现了代表性示例，旨在将本文的主题——在游戏引擎中实现现实的人群移动模型——置于更大的人群建模研究背景中。

区分人群行为模型和人群移动模型是有用的。人群行为模型复制人群成员关于执行什么动作的决策。人群成员可用的动作库通常取决于模型的预期用途。它们可能仅限于疏散模型的移动，也可能包括非移动动作，例如在抗议和骚乱模型中唱歌、扔石头或挥舞旗帜。人群行为模型可以使用一系列建模方法，包括人工智能（AI）的各种方法。个人、文化和情境因素可能影响人群成员的行为。

相比之下，人群移动是众多人群行为类型中的一种。一旦人群行为模型、脚本或其他方法确定人群成员应该移动到新位置，人群移动模型应该执行移动。路线的前期规划可以从人群成员的起始位置到他/她的目的地。人群移动模型复制人群成员从一个位置到另一个位置的身体移动。人群移动模型可以基于物理或运动学。逼真的移动很重要，因为人类观察者对模拟人类即使稍微不自然的行为也非常敏感。人群移动模型与个人移动模型的不同之处在于，人群模型应考虑构成人群移动特征的近距离和由此导致的拥堵。地形、天气和其他因素也可能影响移动。

Reynolds著名的抽象鸟群运动模型（他称之为"boids"）是人群移动建模的重要推动力。该模型使用了粒子系统的思想，将每只鸟表示为一个粒子。类似地，基于粒子系统的模型最近被用于火灾疏散研究。元胞自动机被应用于表示人群成员导航。另一种模型关注以足够快的速度近距离移动的群体，其运动动力学（加速度、速度和转弯半径）很重要，特别关注避免碰撞。专门为高密度人群开发的人群成员移动算法计算了人群成员移动的力矢量（方向），作为代表目的地、墙壁、障碍物、其他人群成员和方向磁滞的贡献力矢量的加权和。

人群移动模型通常与底层地形表示密切相关。用于城市紧急搜索和救援行动模拟的人群移动模型依赖于地形区域在执行前离散化为节点和边图。人群成员基于为每个节点计算的吸引力值概率性地沿着边从一个节点移动到另一个节点，该吸引力值考虑了心理和环境因素，并且可能随每个时间步变化。另一种在离散化为单元的地形上工作的模型，将基于力的机制与D*增量图搜索算法相结合，以控制人群成员的移动。

疏散是人群移动建模中特别感兴趣的应用。在疏散中，人群移动因社会学或情感元素而变得复杂，特别是恐慌。恐慌的疏散者倾向于关注即时的个人利益，忽略否则会限制其移动的社会和文化规范，如人际距离。恐慌可能会降低人群成员的注意力，导致出口被忽视，因此恐慌实际上可能会延迟疏散中人群成员的逃离。人群移动模型已针对各种疏散相关应用开发，包括评估障碍物对疏散效率的影响，分析建筑火灾期间的疏散，分析恐怖炸弹袭击期间的疏散，分析使用自动扶梯的地铁系统疏散，分析公路隧道疏散，以及分析促进疏散的建筑设计特征。早期用于模拟非疏散人群移动的离散事件模拟环境随后被用于实现一套表示紧急情况下人群成员行为不同方面的疏散模型。不利视线条件的影响（如可能存在于烟雾弥漫的建筑中的情况）使用盲从移动规则进行建模。基于昆虫群集的生物学启发模型也被用于模拟人群恐慌反应。

为了逼真，人群移动模型，特别是恐慌移动模型，应允许因压力和踩踏而造成伤害或死亡的可能性。这种伤亡在疏散中是主要问题，人群模型已被用于专门分析这一风险。

游戏引擎中已存在一些人群模型实现的实例。

---

## 3. 人群移动模型

本工作中使用的基于物理的人群移动模型来自Helbing、Farkas和Vicsek。（为简便起见，以下简称Helbing模型）。它基于在牛顿力平衡模型中包含社会力。回顾牛顿力和运动模型F=ma，其中F是物体上的力，m是物体的质量，a是速度随时间变化率。作用在人群中人i上的力可以写成公式（1），其中mi是人的质量，a=dvi/dt。

公式（1）右边的第一项与人i在时间间隔Ti内的运动有关，其中人的初始速度为v⁰ᵢ，期望方向为e⁰ᵢ。项mi(v⁰ᵢe⁰ᵢ-vi(t))/τi表示人的当前速度和方向vi(t)与他/她的期望速度和方向v⁰ᵢe⁰ᵢ之间在很小的时间间隔τi内的差异的离散近似。因此，乘积mi(v⁰ᵢe⁰ᵢ-vi(t))/τi表示由于期望运动和当前运动之间的差异而产生的力的离散近似。公式（1）中的项∑j≠i fi,j和∑w fw,i分别表示与其他人和墙壁及其他障碍物相互作用产生的力。

对于人群中介i和j的每个相互作用对：

公式（2）中数量rij-dij出现三次；rij是每个人i和j的半径之和；dij是从i的中心到j的距离。如果这个数量为正，人们就处于相互接触或碰撞的状态。

在公式（2）右边的第一个乘积中，指数由常数Ai和Bi改变。这些常数只与人i相关，与人j无关。Ai和Bi表示人i在人群中被另一个人靠近或接触时的社会行为。显然，当Ai很大或Bi很小时，公式（2）中第一个乘积的值变得更加重要。随着rij-dij的增加（意味着人i和j越来越近），指数变大，一旦rij-dij为正（处于碰撞状态），增长迅速。函数g(rij-dij)在参数为正时等于参数，否则为零。上式中的第二项kg(rij-dij)表示实际碰撞的力。Helbing模型的这个实现用相同大小的力表示人与人之间的所有碰撞。这种抽象似乎不会显著影响模型在本次模拟中的保真度。在这个实现中，模型进一步简化为假设所有人都同样厌恶与他人进行身体接触。

和Ai exp[(rij-dij)/Bi] + kg(rij-dij)乘以矢量nij，nij是从人j的中心指向人i的中心的归一化矢量，因此与社会行为和碰撞相关的力是相加的。

公式（2）中的第三项kg(rij-dij)Δvji tiji与人i和人j之间的摩擦有关。κ是另一个缩放常数，函数g(rij-dij)如前所述。矢量tiji表示j和i之间的切向方向，通过取nij的z分量和x分量的负值形成新矢量ti=(-z,y,x)。tij确保摩擦力的方向与人i和人j之间的接触点相切。当与另一个人或物体接触时，摩擦力作用为限制运动，并且在运动方向相反的方向上，即人与人物或人物与物体之间接触点的切向方向。数量Δvjz是一个标量，通过取人i和人j的方向向量的差异，并将该差异与矢量tij进行点积得到。Δvji还作为乘数，缩放碰撞人群之间的摩擦力。

公式（1）中的项∑w fi,w表示人i受到与墙壁或其他障碍物相关的力之和，由如下项组成：

在计算力fiw时，所有项都类似于涉及与其他人的力相互作用的情况，但涉及摩擦的项除外；项ri-diw表示人到墙壁W的距离，函数g、常数k和κ类似。twi也类似，表示人与物体接触点处的切向矢量。

因为墙壁不移动，人和物体之间的摩擦计算不同，因子twi类似于tij。因为物体是静止的，与人速度的点到乘积和切向矢量twi取代了公式（2）中的Δvtji。回忆Δvji包括人i和人j的速度分量。在与物体碰撞的情况下，物体是静止的，所以标量Δv'ji被vₐ·twi取代在摩擦项中。这些相互作用力的总和（物理和社会）改变了人在人群中移动的方向。

使用Helbing模型的疏散模拟通常会产生类似于图1所示的人群成员配置。疏散的人群聚集在单个出口周围，形成半圆形簇，通常称为"拱形"。在非恐慌状态下，人群成员遵守社会人际距离约束并安全疏散。在恐慌状态下，人群成员可能会相互推搡，与期望方向和速度相关的力占主导地位，超过了鼓励人群成员避免接触的社会力。

因此，人群成员被挤压在一起，并挤入墙壁和其他障碍物。

---

## 4. 实现

本节详细介绍了使用Unity游戏引擎实现人群移动模型和模拟人群移动的虚拟世界。突出了非恐慌和恐慌疏散场景之间的差异。本节还描述了对实现模型的功能测试。

初始实现使用了一个简单的疏散场景，方便作为疏散研究的基线。（更现实的场景用于验证，见第5节。）在简单场景中，占据单个矩形房间的一组人群成员通过单个出口疏散。人群成员的实现在场景开始执行时可以分布在整个房间中。一旦生成，人群成员通过出口移动到房间外面的位置。人群移动模型包括Helbing模型的非恐慌和恐慌版本；后者包括额外的人群力项，如第3节所述。

### 4.1 Unity场景

基本疏散场景（房间、出口、人群成员，以及非恐慌或恐慌的人群状态）被实现为Unity场景。从空场景开始，地面通过添加平面创建，并定位使较长边的中心位于场景原点。然后通过转换四个立方体对象并将它们放置在平面周围来构建墙壁。地面和墙壁设置为碰撞体对象。Unity中的碰撞体对象使对象坚固，其他对象不能穿过它。使用Unity中可用的材质功能添加视觉真实感，这些功能可以应用于环境中对象的表面。地面使用基本地球材质，墙壁使用砖砌材质。云被添加到场景周围的Skybox中。

图2显示了为人群模拟环境实现的房间的俯视图。房间宽100单位，深50单位，墙壁高8单位。Unity中的物理世界使用标准3D笛卡尔坐标映射，表示为(x,y,z)，其中x和z表示包含地面的平面，y是上下维度。图中标记为O的点是世界坐标系统的原点(0,0,0)。墙壁相对的中间有一个两单位宽的开口，这是人群成员用来疏散房间的出口。这个目标出口点在图中标记为T，位于(0,0,-49)。

为了使对象在场景中像现实生活中一样交互，碰撞体必须作为子对象附加到场景中的父对象。碰撞体对象的使用和行为是Unity游戏引擎中物理建模的基础。碰撞体使游戏引擎能够检测到其父对象之间的碰撞。静止对象，如墙壁、岩石、树木，甚至地面平面，都必须是碰撞体的父对象。没有碰撞体，场景中的对象会穿过地面或相互穿过而没有影响，产生不现实的行为。地面平面和墙壁每个都添加了RigidBody碰撞体作为子对象。在Unity中，RigidBody碰撞体对象有事件处理方法，可以在发生碰撞时调用以执行特定操作。

### 4.2 人群成员

为了实现人群成员，我们从Unity资源商店下载了由Vu Studios开发的名为Relaxed Man Character的Unity资源。这个资源是一个Unity预制体对象的示例，已创建为可在各种游戏或项目中实例化的模板。Relaxed Man预制体提供了人群成员所需的许多特征，包括一个完全绑定的人物模型。Relaxed Man提供三种动画选项：Walk 1、Walk 2和Run。Walk 1被修改用于非恐慌场景，Run用于恐慌场景。这两种步行动画没有提供所需的平滑运动，因此需要修改一些动画参数。Relaxed Man的默认物理特征也被修改，包括修改角色的质量和子胶囊的大小和直径。测试这些修改后，修改后的角色保存为自定义预制体。然后可以在场景中的多个位置实例化以创建人群。得到的定制版本称为Crowd Guy。Relaxed Man和Crowd Guy都是对象类。图3（左）显示了一个Crowd Guy实例在简单疏散场景中。

虽然场景中的静态对象（如墙壁和地面）使用基于物理的RigidBody控制器，但对于类人对象，更好的选择是使用另一种称为CharacterController的控制器。与RigidBody控制器相比，CharacterController的优势在于管理Crowd Guy实例的移动。包括攀爬物体在内的正常运动和动画可以在CharacterController中以更自然的运动实现。通常，CharacterController是在Unity中实现玩家或类人非玩家角色的推荐方法。

创建CharacterController时，默认会创建并附加一个Capsule Collider。Capsule Collider是一种胶囊形状的碰撞体对象，可用于类人资产，即人群成员。图3（右）显示了带有CharacterController的Crowd Guy，展示了Capsule Collider组件。该图还显示了一个立方体相邻于Crowd Guy的腹部，三个箭头从立方体发出。这个立方体相对于Crowd Guy的原点位于(0,0,0)点。一组子数据元素，称为transform，在场景中定位角色。如前所述，场景中有一个点是场景的原点。场景中的每个Crowd Guy都有一个相对于场景原点的x、y和z分量位置，以及允许角色在场景中正确定向的旋转。

出于性能原因，使用与CharacterController实现的Capsule Collider比网格碰撞体更受青睐。虽然基于完全网格化的人物角色实现碰撞体可能更现实（从观察碰撞的角度），但计算开销巨大。此外，使用Capsule Collider与网格碰撞体相比，模型的现实性不会受到显著影响。

在非恐慌场景中，CharacterController的运动由Unity AI引擎通过使用NavMesh代理扩展CharacterController来管理。NavMesh代理促进Crowd Guy在场景中移动而不与物体或其他Crowd Guy碰撞。这是NavMesh代理的目的。非恐慌场景中使用NavMesh来利用Unity AI引擎。虽然NavMesh可以在一定程度上进行调整，但它不允许达到先前工作中展示的模拟结果粒度。然而，选择NavMesh大大简化了非恐慌场景的实现，并且只需要有限的校准即可产生现实的结果。

一旦为克隆指定了目标位置，就会向NavMesh代理添加一个名为MoveTo的组件脚本。代码摘录1是非恐慌场景中的MoveTo方法。第6-10行声明并初始化了NavMesh代理。第15-16行找到名为Spawn Crowd NP的实例化预制体的NavMesh代理。第17-23行处理未找到代理的情况。第27-29行建立目标并指示克隆向目标移动。目标位置设置为(0,0,-300)，这是距离房间外的一个大距离。这是必要的，以便克隆可以离开而不会阻挡仍在试图逃离房间的其他克隆。使用NavMesh确保克隆可以找到目标，并将避开障碍物和其他克隆。第30行将克隆的健康值初始化为500。

随着模拟运行，每帧调用另一个脚本Update。在每次更新时，评估克隆的位置。当克隆到达z=-50时，认为它已经逃离了房间。

碰撞处理程序OnCollisionEnter在克隆与场景中的另一个克隆或对象碰撞时调用。OnCollisionEnter递减克隆的健康值。如果健康为零或更少，克隆被标记为死亡，并更新死亡克隆数的统计数据。然而，在非恐慌场景中，没有记录碰撞，这是预期的。

图4显示了非恐慌场景执行的俯视图。人群正在形成围绕出口的特征性拱形，类似于图1中之前看到的图5从另一个角度显示了相同的非恐慌场景。因此，非恐慌模拟可以被认为满足了定性面验证。

### 4.3 疏散场景

如前所述，恐慌和非恐慌疏散场景都被模拟。人群体移动的实现方法在场景之间有所不同。非恐慌人群的实现同时使用Unity物理引擎和Unity AI引擎，后者采用Unity导航网格的形式。恐慌人群的实现仅使用Unity物理引擎；人群行为完全基于自定义脚本。

恐慌和非恐慌人群及场景当然可以使用单一集成脚本实现。然而，Unity AI引擎的"黑箱"性质使得这种实现存在问题，因此我们的实现由恐慌和非恐慌的单独脚本组成。这种实现还有一个好处，即简化了为每个场景调整模型参数的过程。合并恐慌和非恐慌模块的工作留待将来进行。

**非恐慌疏散**

场景的实例化（即房间和出口）在非恐慌和恐慌版本中相似，但在人群成员的实现上存在一些差异。当人群不恐慌时，第3节讨论的涉及可接受社会距离的力作用在克隆上，但身体力和摩擦力不会，因为通常不会发生碰撞。这些物理力在Helbing模型中为零。因此，非恐慌场景的Crowd Guy预制体表明了与恐慌场景不同的配置。

差异之一是非恐慌Crowd Guy克隆使用Unity Navigation来规划通过出口的路径，同时避开物体或其他克隆。通过让克隆避开路径中的物体，Unity Navigation提供了模拟人群社会力所需的功能。为了在非恐慌场景中使用Unity Navigation，创建了导航网格或NavMesh。NavMesh是一个简化的几何结构，由场景中所有静止对象组成。然后为每个克隆添加NavMesh组件或代理；这使它们能够规划绕过NavMesh中各种障碍物的路径。

非恐慌场景利用NavMesh来利用Unity AI引擎。虽然NavMesh可以调整，但它不允许达到先前工作中展示的模拟结果粒度。然而，选择NavMesh大大简化了非恐慌场景的实现，并且只需要有限的校准即可产生现实的结果。

**恐慌疏散**

恐慌场景的实现与非恐慌场景在几个方面不同。值得注意的是，克隆移动得更快，并且移动不是通过NavMesh代理由Unity AI引擎促进的，不像非恐慌场景。

如前所述，当恐慌发生时，社会力被添加到与其他人群成员碰撞的物理力中。克隆被脚本化向目标(0,0,-49)移动，这只是在房间内部（见图2），然后转身通过门移动，此时被认为已经逃离。

代码摘录2表示恐慌场景的Update方法，每帧执行一次。Update的非恐慌和恐慌版本的不同之处在于，它们附加在不同类的对象上，并且实现了模拟人群恐慌所需的物理力。在恐慌场景中，Update是CharacterController对象的脚本组件，而在非恐慌场景中，Update是NavMesh代理的组件。因为NavMesh代理提供了非恐慌情况下适当的社交距离，其在恐慌场景中的缺失更准确地模拟了恐慌人群。

代码摘录2表示与期望方向相对于当前方向的运动相关的公式(1)部分。第2行检索连接到克隆的CharacterController的对象引用。第3-6行测试克隆是否已经逃离，如果是，则继续当前方向的移动并返回。如果克隆尚未逃离，第8-10行计算从指定在(0,0,-49)的出口目标到克隆当前位置的距离。第12-15行指示角色转向目标。第18-24行创建指向目标的归一化方向矢量。第26-29行检查克隆是否在当前更新期间逃离，如果是，则增加逃离计数。第31-39行如果(z<-49)已经到达，则让克隆转身通过门，并继续朝该方向移动。随机元素用于方向，以便克隆在超越目标时不会聚集在一起。第41行使用SimpleMove方法将克隆移向目标和更远的地方。SimpleMove忽略方向矢量的y分量，并按与速度变量成比例的方式移动克隆。

在代码摘录3中，OnControllerColliderHit方法是一个事件处理程序，只要CharacterController检测到碰撞就会运行。它实现了公式(1)和(2)分别关于人与人物或物体碰撞中承受的力的分量。第2行找到与克隆碰撞的碰撞体，第5行调用takeDamage方法来记录碰撞的人物的损害。第14-21行计算3元素矢量dv的值，该矢量表示由于碰撞施加在一个人身上的力的差异。这些计算与Helbing模型关于人群成员基于碰撞改变方向一致。

在takeDamage方法中，在验证克隆尚未逃离后，克隆的健康值递减。如果角色的健康为负，则确定该角色在模拟中死亡，并被替换为倒地的布娃娃。更新表示碰撞、死亡和逃离数量的计数器。

代码摘录4显示了addColl和updateDisplay方法。第1-13行是addColl方法，更新碰撞计数，并在必要时更新死亡计数。如果克隆死亡，则创建一个新位置向量，等于作为参数传递给addColl的死亡游戏对象的位置。在第10行，在死亡角色的位置实例化一个新预制体。这个新角色是一个名为Ragdoll的Unity对象，它会立即倒在地上。Ragdoll包含每个绑定角色部分的RigidBody碰撞体，并将与CharacterController碰撞，因此它们成为场景中的障碍物，因此剩余的克隆必须绕过或攀爬。

图6显示了恐慌场景的俯视图。人群正在以类似于非恐慌场景的方式围绕出口形成半圆形拱形。与非恐慌版本不同，克隆彼此之间、墙壁和出口非常紧密地挤在一起。可以看出，虽然克隆正在逃离，但它们在出口之外的物理分散程度比非恐慌场景（图4）中更多，因为每个时间段逃离的人更少。图7显示了同一场景从另一个角度的另一次运行。这显示了地面上的死亡克隆和活着的克隆试图攀爬它们逃离。

### 4.4 功能测试

功能测试的目标是评估模型实现的正确性，并确认产生与预期一致的合理定性结果。使用已经描述的基本疏散场景，该场景有一个带单个出口的简单矩形房间。使用了五种不同的人群规模（50、100、150、200和250），并测试了两种场景，非恐慌和恐慌。场景在不同的人群规模和场景之间没有改变。模拟为人群规模和场景的每种组合执行了五次。图5和6来自执行非恐慌人群规模为200的场景，图6和7来自执行恐慌人群规模为200的场景。表1总结了模拟的定量结果。该表显示了每种人群规模和场景组合的疏散时间、碰撞次数、死亡人数和逃离人群成员的均值。疏散时间是最后一个人群成员离开房间或死亡的时间。

非恐慌场景产生有序的人群向出口移动。出口变得拥堵，但个人人群成员能够相对高效地通过，而不会对彼此造成任何损害。因为人群成员使用Unity Navigation实现，非恐慌人群成员保持社交距离，因此在任何人群规模的任何非恐慌执行中都没有发生碰撞或死亡。

在恐慌场景中，人群成员比非恐慌状态移动得更快。结果，出口堵塞得更快。由于恐慌和拥堵，人群成员在试图到达和通过出口时开始相互推挤。这导致发生了一些碰撞，一些人群成员受到足够的伤害而死亡。碰撞和死亡人数随人群规模增加。未被杀死的的人群成员必须爬过死亡的人群成员，进一步减慢他们的离开速度。人群成员的逃离速度是不规则的，这与Helbing模型的其他实现一致。

两种场景都产生了与我们的预期一致的结果，这些预期来自使用Helbing模型的其他模拟和我们之前的工作。在模拟过程中，疏散的人群成员在出口门周围形成了逼真的拱形结构，这构成了模型非正式定性面验证。这些模拟还表明，当人群不恐慌时，疏散可以无伤害地进行，这与文献一致。

---

## 5. 验证

功能测试成功完成后，基于具有更复杂场景的实际人群疏散事件进行了定量校准和验证。通过重新创建事件并将其结果与实际事件进行比较来验证模型是一种有效的验证方法，称为预测验证或回溯预测。这通常（但肯定不是唯一）用于战斗模型。本节报告了定量验证模型的过程和结果。

### 5.1 验证事件

用于模型验证的事件是2003年2月20日在罗得岛州西沃里克市Station夜总会发生的夜总会火灾期间的恐慌疏散。选择此事件来验证模型是因为可用数据的数量、该数据的细节以及该数据的权威来源。该事件至少在之前被用于模型验证两次，尽管每次方式不同。

在实际事件中，夜总会内部拥挤的音乐会上使用的烟火点燃了墙壁中的聚氨酯绝缘材料，引发了火灾，迅速引发了恐慌疏散。巧合的是，当地电视台的一名摄像师当晚正在夜总会录制一份关于夜总会过度拥挤的报告；该报告的动机是三天前在芝加哥另一家夜总会发生的致命踩踏事件。摄像师能够安全撤离，从夜总会内部和外部拍摄了火灾和疏散过程。该视频和随后的调查记录了疏散时间表和事件（如火灾点燃、具体个人出口、前门附近的堵塞、紧急人员的反应）、人群密度的估计，以及关于逃离人数和使用出口进行逃离的细节。

据报道，火灾发生时夜总会建筑内的人数分别为458和462。本工作使用458。火灾共造成100人死亡，96人在事件中死亡，4人因事件中受的伤而后死亡。死亡原因包括火灾本身（烧伤和烟雾吸入）和恐慌人群产生的挤压力量。恐慌人群的挤压阻碍了一些人群成员在浓黑烟雾中被困之前安全出口的能力。从最初点燃到逃离，大多数人的时间不到90秒。恐慌疏散直到点燃后约30秒才开始；起初，一些人短暂地认为火灾是音乐会烟花的故意组成部分。

建筑有四个不同的门；所有这些门以及两个不同的窗户都被用来逃离建筑。然而，其中一个门，即平台出口，靠近初始点燃位置，仅在火灾前30秒内可达，另一个门，即厨房门，大多数人不知道，因此没有多少人使用它逃离。

### 5.2 场景实现

Station夜总会建筑和疏散在Unity中重新创建。这样做需要复制建筑布局，在建筑内的适当位置实例化正确数量的人群成员，并为每个人群成员分配与其在实际疏散中使用出口的比例一致的出口。

图8显示了夜总会的平面图，图9显示了Unity实现。一些用于存储和办公空间的墙壁和较小的房间没有实现以简化；省略的房间不在疏散路线上，不影响人群成员的离开时间。

对于每次模拟执行，在夜总会的主房间内为人群体成员创建生成点。Spawn Crowd脚本被修改为支持在夜总会墙壁内为人群成员生成新的生成点。在代表夜总会主房间边界x和z间隔内生成两个均匀分布的随机变量。这些随机变量然后用作Crowd Guy克隆的初始位置。对每个人群成员重复此过程。

在代码摘录5中，每个克隆被随机分配六个出口之一，克隆将通过该出口尝试离开夜总会。出口分配过程不代表应急响应者管理疏散；相反，它代表了在事件中每个人群成员做出的个人出口选择决策。研究表明，在恐慌疏散中，人群成员倾向于通过他们最熟悉的门离开建筑。在不熟悉的建筑中，最有可能是他们进入建筑所使用的同一门，这解释了与主门相关联的相对较大的概率。

夜总会的主房间被分成两个区域，以便克隆将被分配到其初始位置附近的出口。右侧区域（相对于图8和9）的克隆被随机分配通过平台出口门、左窗或主门离开。左侧区域的克隆被随机分配通过主门、右窗、酒吧门或厨房门离开。给定克隆被分配到特定出口的概率与实际疏散中通过该门或窗户离开的人群成员数量成比例。因为分配是随机的，每次运行之间分配给每个人群成员的出口和分配给每个出口的人群成员总数存在变化。

当模拟执行脚本检查克隆是否逃离时，由于内墙，克隆必须从其初始生成点路由到分配的出口点。这是通过根据克隆的初始位置创建中间目标点来实现的。

图10显示了夜总会疏散模拟执行的俯视图。疏散的克隆已经围绕主出口形成了预期的半圆形拱形。一些克隆根据分配的出口通过其他门或窗户离开。图11显示了同一模拟，但稍后从另一个角度。图12显示了模拟结束；死亡克隆在主出口门附近。

### 5.3 校准

模型校准是将模型及其结果与被建模的真实系统进行比较并修改模型以提高其准确性的迭代过程。当在夜总会场景上测试时，模型最初产生不现实的高碰撞和死亡次数。需要进行校准以使模型的结果与实际事件保持一致。

模型通过迭代调整克隆的两个参数进行校准：移动速度和初始健康。移动速度参数决定了克隆向其分配出口移动的速度，除非因拥堵而减慢。健康参数决定了与其他克隆的多少次碰撞会导致克隆死亡。

模型被执行，参数值被调整以找到产生与实际疏散一致且物理上现实的值的值。在校准过程早期，速度和健康参数值对所有克隆是相同的。凭借一致的值，拥挤导致的死亡人数比火灾和烟雾吸入导致的死亡人数不现实地更高。在校准过程后期，使用正态分布随机生成从克隆到克隆不同的速度和健康值。使用在人群成员之间不同的健康参数值导致拥挤死亡人数与烟雾吸入死亡人数相当，更加现实。产生与实际事件最匹配结果的参数值是一致的速度和正态分布的健康。

最终，速度和健康的校准调整导致值在一个模拟中产生的总死亡人数密切近似实际事件中发生的100次死亡。如前所述，人群成员在火灾后约有90秒逃离，然后才会在夜总会内死于火灾和烟雾，实际疏散直到火灾开始后约30秒才开始。验证运行在疏散开始时启动，因此在模拟中60秒后留在建筑内的克隆被认为是死于火灾和烟雾吸入。

### 5.4 验证结果

在校准过程中找到速度、健康和出口分配概率的最佳值后，模型随后被验证。由于模型中存在的随机性，包括每个人群成员的生成点位置、健康值和出口分配，模拟结果存在运行之间的变化。因此，在验证过程中，夜总会疏散模拟被执行30次。记录每次运行的结果，包括踩踏死亡、火灾和烟雾死亡、总死亡和总逃离。重要的是，在校准过程中设置的参数值随后没有调整；在验证过程中没有对模型或其参数进行任何更改。

表2详细列出了30次验证执行的结果。"拥挤死亡"列显示因与其他人群成员碰撞而死亡的人数，"火灾和烟雾死亡"列显示留在建筑中60秒后因此被认为死于火灾或烟雾吸入的人数，"总死亡"列是两种死亡类型的总和。"逃离"列是能够离开建筑的人数。

置信区间用于定量评估验证运行的结果。置信区间通常用于模型验证，当随机模型多次运行的结果与单一实际事件比较时，或者当对物理现象的多次测量与确定性模型的单一运行结果比较时。人群移动模型是随机的，一个事件用于验证，因此前一种情况适用。验证中考虑的反应变量是总死亡和逃离。模型被执行30次，记录反应变量的值。除了这些反应变量的均值、标准差、最小值和最大值外，还使用学生t分布计算了95%置信水平的置信区间。表3详细列出了这些计算的结果。如表所示，总死亡的置信区间为[96.11,106.89]，包括实际事件值100，逃离的置信区间为[351.11,361.89]，也包括实际事件值358。因此，对于这两个反应变量，模型被认为是有效的。

可以争论两个反应变量总死亡和逃离实际上是一个反应变量的两个互补视图，因为总死亡和逃离总是加起来是458，即夜总会中最初的人群成员数量。从这个角度来看，模型使用适当的置信区间验证了一个反应变量（尽管是一个重要的反应变量），即总死亡或逃离。

---

## 6. 发现和未来工作

本文详细描述了如何在Unity游戏引擎中实现基于物理的人群移动模型。Unity包含用于2D和3D图形生成的渲染引擎和包含碰撞检测功能的物理引擎。在Unity中创建可用的高维现实或想象世界的表示相对容易，与使用高级编程语言实现相同模型和场景可能需要的工作水平相比，优势明显。

建模结果与先前实现此类模型的努力一致。文献中发现的人群疏散的关键特征，如出口周围拱形的形成，在基于Unity的模型中得到了适当复制。总体而言，实现表明，在这种配置下，Unity游戏引擎可用于以相当简单 yet 有用且逼真的方式模拟人群移动，因此可能是对建模人群评估感兴趣的研究人员的可行工具。

此外，使用Station夜总会事件对模型进行定量验证表明，基于Unity的人群疏散模型可以验证为准确的，至少对于与夜总会类似的建筑配置（出口有限的小型建筑和单一危险点）。它们还展示了用于此类模型的验证过程。

有多种方式可以扩展和增强这项工作：

- 使用增加的人群规模执行模拟，以探索游戏引擎的计算极限。
- 不仅使用Helbing模型来确定人群成员的碰撞后方向，而且还使用其对人群压力的计算来确定每次碰撞的损害程度。在更新人群成员健康时考虑相对损害。
- 建模非直接移动，即由于障碍物、视线不良或拥堵，人群成员沿着到达分配出口的非直接路径移动。
- 建模人群成员改变其出口选择决定到另一个出口，如果他们在到达所选出口的途中被阻挡。
- 允许不同的人群成员加速度和速度参数，以反映个人对感知人群拥堵的反应和多次非致命碰撞的累积损害影响。
- 模拟每个人群成员根据他们对情况可能感知到的内容从非恐慌状态到恐慌状态的个别转变，导致并非所有人群成员都会同时恐慌并开始疏散的模拟。
- 将恐慌和非恐慌人群的实现合并为集成脚本。
- 使用额外的历史人群疏散事件验证模型，包括与所使用的事件不同的那些（更大的建筑、更多的出口和/或多个危险点）。

---

## 参考文献

[1] Farkas I., Helbing D., Molnar P., Vicsek T., Simulation of pedestrian crowds in normal and evacuation situations, Pedest. Evac. Dyn. 21(2):21-58, 2002.

[2] Thalmann D., Musse S., Crowd Simulation, Springer-Verlag, London, 2007.

[3] Pelechano N., Allbeck J., Badler N., Virtual Crowds: Methods, Simulation, and Control, Morgan and Claypool, San Rafael, 2008.

[4] Loftin R., Petty M., McKenzie F., Gaskins R., Modeling crowd behavior for military simulation applications, in Rouse W., Boff K.(eds.), Organizational Simulation. John Wiley and Sons, New York, pp.471-536, 2005.

[5] McKenzie F. D., Petty M. D., Kruszewski P. A., Gaskins R. C., Nguyen Q.-A., Seevinck J., Weisel E. W., Integrating crowd-behavior modeling into military simulation using game technology, Simul. Gaming 39(1):10-38, 2008.

[6] O'Sullivan C., Cassell J., Vilhjálmsson H., Dingliana J., Dobbyn S., McNamee B., Peters C., Giang T., Levels of detail for crowds and groups, Comput. Graf. Forum21(4):733-741, 2002.

[7] Reynolds W., Flocks, herds, and schools: A distributed behavioral model, ACM SIGGRAPH, Proc. Fourteenth Annual Conf. Computer Graphics and Interactive Techniques, Anaheim California USA, ACM, New York, pp.27-31, 1987.

[8] Fillippdis L., Galea E., Gwynne S., Lawrence P., Representing the influence of signage on evacuation behavior within an evacuation model, J. Fire Prot. Eng. 16(1):37-73, 2006.

[9] Bandini S., Manzoni S., Situated cellular agents for crowd simulation and visualization, Cybern. Syst. Int. J. 38(7):729-753, 2007.

[10] Brogan D., Hodgins J., Group behaviors for systems with significant dynamics, Auton. Robots 4(1):137-153, 1997.

[11] Pelechano N., Allbeck J., Badler N., Controlling individual agents in high-density crowd simulation, ACM SIGGRAPH, Proc. 2007 ACM SIGGRAPH/Eurographics Symp. Computer Animation, pp.99-108, San Diego, Eurographics, Aire-la-Ville, 2007.

[12] Brenner M., Wijermans A., Nussle T., de Boer B., Simulating and controlling civilian crowds in robocup rescue, https://www.semanticscholar.org/paper/Simulating-and-Controlling-Civilian-Crowds-in-Brenner-Wijermans/891b8d457218cf6d81b49d328c1a2be5608b123c, 2005.

[13] Sornum K., Liang Y., Cai W., Low M., Zhou S., 3D visualization and animation of crowd simulation using a game engine, GSTF, Proc. 2009 Computer Games, Multimedia, and Allied Technologies Conf. GSTF, Singapore, 2009, doi:10.5176/978-981-08-3190-5 455.

[14] Braun A., Musse S. R., de Oliveira L. P., Bodmann B. E., Modeling individual behaviors in crowd simulation, 16th Int. Conf. Computer Animation and Social Agents, IEEE, New Brunswick, NJ, USA, pp.143-148, 2003.

[15] Papelis Y. E., Kady R. E., Bair L. J., Weisel E. W., Modeling of human behavior in crowds using a cognitive feedback approach, SIMULATION: Trans. Soc. Model. Simul. Int.93(7):567-578, 2017.

[16] Helbing D., Farkas I. J., Molnár P., Vicsek T., Simulation of pedestrian crowds in normal and evaluation situations, in Schreckenberg M., Sharma S. D.(eds.), Pedestrian and Evacuation Dynamics, Springer, New York, 21-58, 2002.

[17] Keating J. P., The myth of panic. Fire J.76(3):57-61, 1982.

[18] Elliot D., Smith D., Football stadia disasters in the United Kingdom: Learning from tragedy? Org. Environ.7(3):205-229, 1993.

[19] Jia X., Yue H., Tian X., Yin H., Simulation of pedestrian flow with evading and surpassing behavior in a walking passageway, SIMULATION: Trans. Soc. Model. Simul. Int.93(12):1013-1035, 2017.

[20] Niu L., Song Y., A simulation model fusing space and agent for indoor dynamic fire evacuation analysis, SIMULATION: Trans. Soc. Model. Simul. Int.92(8):215-232, 2016.

[21] Shendarkar A., Vasudevan K., Lee S., Son Y., Crowd simulation for emergency response using BDI agents based on immersive virtual reality, Simul. Model. Pract. Theory 16(9):1415-1429, 2008.

[22] Kinsey M. J., Galea E. R., Lawrence P. J., Modelling evacuation using escalators: A London underground dataset, in Weidmann U., Kirsch U., Schreckener M.(eds.), Pedestrian and Evacuation Dynamics 2012, Springer, Cham Switzerland, 385-399, 2014.

[23] Ronchi E., Fahy R., Colonna P., Berloco N., Validation and calibration of the EXIT89 evacuation model for road tunnel evacuation applications, in Weidmann U., Kirsch U., Schreckener M.(eds.), Pedestrian and Evacuation Dynamics 2012, Springer, Cham Switzerland, pp.543-550, 2014.

[24] Hu M., A high-fidelity three-dimensional simulation method for evaluating passenger flow organization and facility layout at metro stations, SIMULATION: Trans. Soc. Model. Simul. Int.93(10):841-851, 2017.

[25] Al-Habashna A., Wainer G., Modeling pedestrian behavior with Dell-DEVS: Theory and applications, SIMULATION: Trans. Soc. Model. Simul. Int.92(2):117-139, 2016.

[26] Jafer S., Lawler R., Emergency crowd evacuation modeling and simulation framework with cellular discrete event systems, SIMULATION: Trans. Soc. Model. Simul. Int.92(8):795-817, 2016.

[27] Yue H., Wang S., Jia X., Shao C., Simulation of pedestrian evacuation with blind herd mentality under adverse sight conditions, SIMULATION: Trans. Soc. Model. Simul. Int.92(6):491-506, 2016.

[28] Bonabeau E., Dorigo M., Theraulaz G., Swarm Intelligence: From Natural to Artificial Systems, Oxford University Press, New York, 1999.

[29] Banerjee S., Grosan C., Abraham A., Emotional ant based modeling of crowd dynamics, Proc. Seventh Int. Symp. Symbolic and Numeric Algorithms for Scientific Computing, IEEE Computer Society, Timisoara Romania, pp.25-29, 2005.

[30] Lee R., Hughes R., Minimisation of the risk of trampling in a crowd, Math. Comp. Simul. 74(1):29-37, 2007.

[31] Low M., Cai W., Zhou S., A federated agent-based crowd simulation architecture, in Zelinka I.(ed.), Proceedings of the 2007 European Conference on Modeling and Simulation, Prague Czech Republic, Digitaldruck Pirrot, Dudweiler, pp.188-194, 2007.

[32] Bott M., Petty M., Implementing a physics based model of crowd movement using unreal development kit, J. Gaming Virtual Worlds 6(3):275-296, 2014.

[33] Helbing D., Farkas I., Vicsek T., Simulating dynamical features of escape panic, Nature407:487-490, 2000.

[34] Unity Technologies, Unity Manual, https://docs.unity3d.com/Manual/index.html, 2016.

[35] Vu Studios, Relaxed Man Character, https://www.assetstore.unity3d.com/en/#!/content/32665, 2015.

[36] Petty M. D., Verification, validation, and accreditation, in Sokolowski J. M., Banks C. M., Modeling and Simulation Fundamentals: Theoretical Underpinnings and Practical Domains, John Wiley and Sons, Inc., Hoboken, NJ, pp.325-372, 2010.

[37] Balci O., Verification, validation, and testing, in Banks, J.(ed.), Handbook of Simulation: Principles, Methodology, Advances, Applications, and Practice, John Wiley and Sons, New York, pp.335-393, 1998.

[38] Barbosa S. E., Petty M. D., A survey and comparison of past instances of combat model validation by retrodiction, Proc. Spring 2010 Simulation Interoperability Workshop, SISO (Simulation Interoperability Standards Organization), Orlando FL, April12-16, 2010.

[39] Grosshandler W., Bryner N., Madrzykowski D., Kuntz K., Report of the Technical Investigation of The Station Nightclub Fire, Vol.1, National Institute of Standards and Technology, Washington, DC, 2005.

[40] Pan X., Computational Modeling of Human and Social Behaviors for Emergency Egress Analysis, Ph. D. Dissertation, Stanford University, June 2006.

[41] Wilgoren J., 21 Die in Stampede of 1,500 at Chicago Nightclub, New York Times, February 18, 2003, Online at http://www.nytimes.com/2003/02/18/us/21-die-in-stampede-of-1500-at-chicago-nightclub.html, Accessed November 8, 2016.

[42] Parker P. E., Tally of a tragedy: 462 were in the station on night of fire, Providence J. 2007, Online at http://res.providencejournal.com/hercules/extra/2003/station_fire/content/STATIONFIRELIST_12-03-07-QL81OLD_v55.2a82be5.html, Accessed November 10, 2016.

[43] Bryner N., Madrzykowski D., Grosshandler W., Reconstructing the station nightclub fire: Computer modeling of the fire growth and spread, Interflam 2007 (Interflam '07) International Interflam Conf. 11th Proc., NIST (National Institute of Standards and Technology), September 3-5, 2, pp.1181-1192, 2007.

[44] Graham T. L., Roberts D. J., Qualitative overview of some important factors affecting the egress of people in hotel fires, Int. J. Hospitality Manage. 19(1):79–87, 2000.

[45] Alp N. C., Çagdaş G., Occupants emergency behavior in Turkey, in Weidmann U., Kirsch U., Schreckenberg M.(eds.), Pedestrian and Evacuation Dynamics 2012, Springer, Cham Switzerland, pp.1123–1133, 2012.

[46] Sagun A., Anumba C. J., Bouchlaghem D., Designing buildings to cope with emergencies: Findings from case studies on exit preferences, Buildings 3(2):442–461, 2013, doi:10.3390/buildings3020442.

[47] Banks J., Carson J. S., Nelson B. L., Nicol D. M., Discrete-Event System Simulation, Fifth Edition, Prentice Hall, Upper Saddle River NJ, 2010.

[48] Petty M. D., Calculating and using confidence intervals for model validation, Proc. Fall 2012 Simulation Interoperability Workshop, SISO (Simulation Interoperability Standards Organization), Orlando FL, pp.37–45, September 10-14, 2012.

[49] Petty M. D., Advanced topics in calculating and using confidence intervals for model validation, Proc. Spring 2013 Simulation Interoperability Workshop, SISO (Simulation Interoperability Standards Organization), San Diego, CA, pp.194–204, April 8-12, 2013.

[50] Oberkampf W. L., Roy C. J., Verification and Validation in Scientific Computing, Cambridge University Press, Cambridge, UK, 2010.

[51] Brase C. H., Brase C. P., Understandable Statistics: Concepts and Methods, 11th edn., Cengage Learning, Stamford CT, 2015.

---

**注**：图表、致谢及参考文献已略去（见原文）。