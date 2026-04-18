# Vue 完全指南（面试版）

深入理解 Vue 的核心概念、原理和最佳实践。

## 目录

- [核心概念](#核心概念)
- [响应式原理](#响应式原理)
- [组件基础](#组件基础)
- [Composition API](#composition-api)
- [虚拟 DOM 与 Diff 算法](#虚拟-dom-与-diff-算法)
- [状态管理](#状态管理)
- [性能优化](#性能优化)
- [Vue 3 新特性](#vue-3-新特性)
- [面试高频问题](#面试高频问题)
- [设计模式](#设计模式)
- [最佳实践](#最佳实践)

---

## 核心概念

### 1. Vue 是什么？

Vue 是一个用于构建用户界面的渐进式 JavaScript 框架，核心特点：

- **渐进式**: 核心库只关注视图层，易于集成
- **响应式**: 数据驱动视图自动更新
- **组件化**: 构建可复用的组件
- **声明式渲染**: 描述状态与 UI 的映射关系

### 2. MVVM 模式

```
View (视图)      ↔      ViewModel (Vue实例)      ↔      Model (数据)
  DOM                   响应式系统、指令                  JavaScript对象

数据变化 → ViewModel 监听 → 自动更新 View
View 交互 → ViewModel 响应 → 自动更新 Model
```

**面试要点**:
- **Model**: 数据层，纯 JavaScript 对象
- **View**: 视图层，DOM 结构
- **ViewModel**: Vue 实例，连接 Model 和 View
- **双向绑定**: v-model 实现 View ↔ Model 同步

### 3. Vue 2 vs Vue 3

| 特性 | Vue 2 | Vue 3 |
|------|-------|-------|
| 响应式 | Object.defineProperty | Proxy |
| API | Options API | Composition API |
| 性能 | 基准 | 更快（约 1.3-2x） |
| Tree-shaking | 不支持 | 支持 |
| TypeScript | 一般 | 更好 |
| Fragment | 不支持 | 支持（多根节点） |
| Teleport | 不支持 | 支持 |
| 包大小 | 较大 | 更小 |

---

## 响应式原理

### 1. Vue 2 响应式原理 (Object.defineProperty)

```javascript
// 简化版响应式实现
class Observer {
  constructor(data) {
    this.walk(data)
  }

  walk(data) {
    Object.keys(data).forEach(key => {
      this.defineReactive(data, key, data[key])
    })
  }

  defineReactive(obj, key, val) {
    const dep = new Dep() // 依赖收集器

    // 递归处理嵌套对象
    if (typeof val === 'object') {
      new Observer(val)
    }

    Object.defineProperty(obj, key, {
      enumerable: true,
      configurable: true,
      get() {
        // 依赖收集
        if (Dep.target) {
          dep.depend()
        }
        return val
      },
      set(newVal) {
        if (newVal === val) return

        val = newVal
        // 新值是对象，继续监听
        if (typeof newVal === 'object') {
          new Observer(newVal)
        }
        // 通知更新
        dep.notify()
      }
    })
  }
}

// 依赖收集器
class Dep {
  constructor() {
    this.subs = [] // 订阅者列表
  }

  depend() {
    if (Dep.target) {
      this.subs.push(Dep.target)
    }
  }

  notify() {
    this.subs.forEach(sub => sub.update())
  }
}

Dep.target = null

// Watcher (订阅者)
class Watcher {
  constructor(vm, exp, cb) {
    this.vm = vm
    this.exp = exp
    this.cb = cb
    this.value = this.get() // 触发 getter，收集依赖
  }

  get() {
    Dep.target = this // 设置当前 watcher
    const value = this.vm[this.exp] // 触发 getter
    Dep.target = null // 清空
    return value
  }

  update() {
    const newVal = this.vm[this.exp]
    if (newVal !== this.value) {
      this.value = newVal
      this.cb.call(this.vm, newVal)
    }
  }
}
```

**Vue 2 响应式流程**:

1. **初始化**: `new Observer(data)` 遍历所有属性，使用 `Object.defineProperty` 转换为 getter/setter
2. **依赖收集**: 读取数据触发 getter，收集当前 Watcher
3. **派发更新**: 修改数据触发 setter，通知所有 Watcher 更新
4. **视图更新**: Watcher 执行回调，更新视图

**Vue 2 响应式局限**:

```javascript
// ❌ 无法监听新增属性
data.newKey = 'value' // 不会触发更新

// ✅ 解决方案
Vue.set(data, 'newKey', 'value')
// 或
this.$set(this.data, 'newKey', 'value')

// ❌ 无法监听数组索引和 length
arr[0] = 'new value' // 不会触发更新
arr.length = 0       // 不会触发更新

// ✅ 解决方案
Vue.set(arr, 0, 'new value')
arr.splice(0, 1, 'new value')
```

### 2. Vue 3 响应式原理 (Proxy)

```javascript
// 简化版 Vue 3 响应式
const reactiveMap = new WeakMap()

function reactive(target) {
  if (reactiveMap.has(target)) {
    return reactiveMap.get(target)
  }

  const proxy = new Proxy(target, {
    get(target, key, receiver) {
      const res = Reflect.get(target, key, receiver)

      // 依赖收集
      track(target, key)

      // 递归处理嵌套对象
      if (typeof res === 'object' && res !== null) {
        return reactive(res)
      }

      return res
    },

    set(target, key, value, receiver) {
      const oldValue = target[key]
      const res = Reflect.set(target, key, value, receiver)

      // 触发更新（值变化时）
      if (oldValue !== value) {
        trigger(target, key)
      }

      return res
    },

    deleteProperty(target, key) {
      const res = Reflect.deleteProperty(target, key)
      trigger(target, key)
      return res
    }
  })

  reactiveMap.set(target, proxy)
  return proxy
}

// 依赖收集
const targetMap = new WeakMap()
let activeEffect = null

function track(target, key) {
  if (!activeEffect) return

  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }

  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = new Set()))
  }

  dep.add(activeEffect)
}

// 触发更新
function trigger(target, key) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return

  const dep = depsMap.get(key)
  if (dep) {
    dep.forEach(effect => effect())
  }
}

// 副作用函数
function effect(fn) {
  activeEffect = fn
  fn()
  activeEffect = null
}
```

**Vue 3 响应式优势**:

```javascript
// ✅ 可以监听新增属性
const state = reactive({ count: 0 })
state.newKey = 'value' // 会触发更新

// ✅ 可以监听数组索引和 length
const arr = reactive([1, 2, 3])
arr[0] = 100    // 会触发更新
arr.length = 0  // 会触发更新

// ✅ 可以监听 Map、Set
const map = reactive(new Map())
map.set('key', 'value') // 会触发更新

// ✅ 支持嵌套响应式
const state = reactive({
  nested: {
    count: 0
  }
})
state.nested.count++ // 会触发更新
```

**Proxy vs Object.defineProperty**:

| 特性 | Object.defineProperty | Proxy |
|------|----------------------|-------|
| 监听新增属性 | ❌ | ✅ |
| 监听删除属性 | ❌ | ✅ |
| 监听数组索引 | ❌ | ✅ |
| 监听数组 length | ❌ | ✅ |
| 性能 | 初始化时递归遍历 | 懒加载，访问时才代理 |
| 兼容性 | IE9+ | IE11+ (无法 polyfill) |

### 3. ref vs reactive

```javascript
import { ref, reactive } from 'vue'

// ref: 包装基本类型和对象
const count = ref(0)
console.log(count.value) // 0
count.value++ // 修改需要 .value

const user = ref({ name: 'John' })
console.log(user.value.name) // 'John'
user.value.name = 'Jane' // 修改需要 .value

// reactive: 只能用于对象
const state = reactive({ count: 0 })
console.log(state.count) // 0
state.count++ // 直接修改

// ❌ reactive 不能用于基本类型
const count = reactive(0) // 无效
```

**面试要点**:

- `ref` 返回 `RefImpl` 对象，通过 `.value` 访问
- `ref` 适用于基本类型和对象
- `reactive` 返回 Proxy 对象，直接访问
- `reactive` 只适用于对象（对象、数组、Map、Set）
- 模板中 `ref` 自动解包（不需要 `.value`）

**解包规则**:

```vue
<template>
  <!-- ✅ 自动解包 -->
  <div>{{ count }}</div>

  <!-- ✅ reactive 中的 ref 自动解包 -->
  <div>{{ state.count }}</div>

  <!-- ❌ 数组和 Map 中的 ref 不会自动解包 -->
  <div>{{ arr[0].value }}</div>
</template>

<script setup>
const count = ref(0)

const state = reactive({
  count: ref(0) // 自动解包
})
console.log(state.count) // 0（不需要 .value）

const arr = reactive([ref(0)])
console.log(arr[0].value) // 需要 .value
</script>
```

---

## 组件基础

### 1. 组件通信

#### (1) Props (父 → 子)

```vue
<!-- 父组件 -->
<template>
  <Child :message="msg" :count="count" />
</template>

<script setup>
import { ref } from 'vue'
import Child from './Child.vue'

const msg = ref('Hello')
const count = ref(0)
</script>

<!-- 子组件 -->
<script setup>
// Vue 3.3+ 可以直接解构
const { message, count = 0 } = defineProps({
  message: {
    type: String,
    required: true
  },
  count: {
    type: Number,
    default: 0
  }
})

// 或使用 TypeScript
interface Props {
  message: string
  count?: number
}

const props = defineProps<Props>()
</script>
```

#### (2) Emits (子 → 父)

```vue
<!-- 子组件 -->
<template>
  <button @click="handleClick">Click</button>
</template>

<script setup>
const emit = defineEmits(['update', 'delete'])

// TypeScript 版本
const emit = defineEmits<{
  update: [id: number, value: string]
  delete: [id: number]
}>()

const handleClick = () => {
  emit('update', 1, 'new value')
}
</script>

<!-- 父组件 -->
<template>
  <Child @update="handleUpdate" @delete="handleDelete" />
</template>

<script setup>
const handleUpdate = (id, value) => {
  console.log(id, value)
}
</script>
```

#### (3) v-model (双向绑定)

```vue
<!-- Vue 2 -->
<Child :value="text" @input="text = $event" />
<!-- 等价于 -->
<Child v-model="text" />

<!-- Vue 3 -->
<Child :modelValue="text" @update:modelValue="text = $event" />
<!-- 等价于 -->
<Child v-model="text" />

<!-- 多个 v-model -->
<Child v-model:title="title" v-model:content="content" />

<!-- 子组件实现 -->
<script setup>
const props = defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue'])

const updateValue = (val) => {
  emit('update:modelValue', val)
}
</script>

<template>
  <input :value="modelValue" @input="updateValue($event.target.value)" />
</template>
```

#### (4) Provide / Inject (跨层级)

```vue
<!-- 祖先组件 -->
<script setup>
import { provide, ref } from 'vue'

const theme = ref('dark')
provide('theme', theme)

// 提供方法
provide('updateTheme', (newTheme) => {
  theme.value = newTheme
})
</script>

<!-- 后代组件 -->
<script setup>
import { inject } from 'vue'

const theme = inject('theme')
const updateTheme = inject('updateTheme')

updateTheme('light')
</script>
```

#### (5) Attrs (透传属性)

```vue
<!-- 父组件 -->
<Child class="custom" data-id="123" @click="handleClick" />

<!-- 子组件 -->
<script setup>
import { useAttrs } from 'vue'

const attrs = useAttrs()
// { class: 'custom', 'data-id': '123', onClick: handleClick }
</script>

<template>
  <!-- 自动透传到根元素 -->
  <div>Child</div>

  <!-- 禁用自动透传 -->
  <div v-bind="$attrs">Child</div>
</template>

<script>
export default {
  inheritAttrs: false // 禁用自动透传
}
</script>
```

#### (6) Refs (父访问子)

```vue
<!-- 父组件 -->
<template>
  <Child ref="childRef" />
  <button @click="callChildMethod">Call Child</button>
</template>

<script setup>
import { ref } from 'vue'

const childRef = ref(null)

const callChildMethod = () => {
  childRef.value.someMethod()
}
</script>

<!-- 子组件 -->
<script setup>
import { defineExpose } from 'vue'

const someMethod = () => {
  console.log('called from parent')
}

// 必须显式暴露
defineExpose({
  someMethod
})
</script>
```

### 2. 生命周期

**Vue 2 Options API**:

```javascript
export default {
  beforeCreate() {
    // 实例初始化后，data/methods 初始化前
  },
  created() {
    // data/methods 已初始化，DOM 未挂载
    // 常用于：数据初始化、API 调用
  },
  beforeMount() {
    // 模板编译完成，DOM 未挂载
  },
  mounted() {
    // DOM 已挂载
    // 常用于：操作 DOM、初始化第三方库
  },
  beforeUpdate() {
    // 数据更新，DOM 更新前
  },
  updated() {
    // DOM 已更新
    // ⚠️ 避免在此修改数据（可能导致死循环）
  },
  beforeUnmount() { // Vue 2 是 beforeDestroy
    // 组件卸载前
    // 常用于：清理定时器、取消订阅
  },
  unmounted() { // Vue 2 是 destroyed
    // 组件已卸载
  },
  errorCaptured(err, instance, info) {
    // 捕获子组件错误
  }
}
```

**Vue 3 Composition API**:

```javascript
import {
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdated,
  onBeforeUnmount,
  onUnmounted,
  onErrorCaptured
} from 'vue'

export default {
  setup() {
    // 相当于 beforeCreate 和 created

    onBeforeMount(() => {
      console.log('beforeMount')
    })

    onMounted(() => {
      console.log('mounted')
    })

    onBeforeUpdate(() => {
      console.log('beforeUpdate')
    })

    onUpdated(() => {
      console.log('updated')
    })

    onBeforeUnmount(() => {
      console.log('beforeUnmount')
    })

    onUnmounted(() => {
      console.log('unmounted')
    })

    onErrorCaptured((err, instance, info) => {
      console.log('errorCaptured', err)
    })
  }
}
```

**生命周期对比**:

| Vue 2 | Vue 3 Composition API |
|-------|----------------------|
| beforeCreate | setup() |
| created | setup() |
| beforeMount | onBeforeMount |
| mounted | onMounted |
| beforeUpdate | onBeforeUpdate |
| updated | onUpdated |
| beforeDestroy | onBeforeUnmount |
| destroyed | onUnmounted |
| errorCaptured | onErrorCaptured |

### 3. 计算属性与侦听器

```vue
<script setup>
import { ref, computed, watch, watchEffect } from 'vue'

const firstName = ref('John')
const lastName = ref('Doe')

// computed: 缓存，依赖变化时才重新计算
const fullName = computed(() => {
  return `${firstName.value} ${lastName.value}`
})

// computed 可写
const fullNameWritable = computed({
  get() {
    return `${firstName.value} ${lastName.value}`
  },
  set(value) {
    const [first, last] = value.split(' ')
    firstName.value = first
    lastName.value = last
  }
})

// watch: 监听特定数据源
watch(firstName, (newVal, oldVal) => {
  console.log('firstName changed:', oldVal, '->', newVal)
})

// 监听多个源
watch([firstName, lastName], ([newFirst, newLast], [oldFirst, oldLast]) => {
  console.log('name changed')
})

// 监听 reactive 对象
const state = reactive({ count: 0, nested: { value: 0 } })

watch(() => state.count, (newVal, oldVal) => {
  console.log('count changed')
})

// deep 深度监听
watch(state, (newVal, oldVal) => {
  console.log('state changed')
}, { deep: true })

// immediate 立即执行
watch(firstName, (newVal) => {
  console.log('firstName:', newVal)
}, { immediate: true })

// watchEffect: 自动追踪依赖
watchEffect(() => {
  // 自动收集 firstName 和 lastName 作为依赖
  console.log('Full name:', `${firstName.value} ${lastName.value}`)
})

// 停止监听
const stop = watchEffect(() => {
  console.log(count.value)
})
stop() // 停止监听
</script>
```

**computed vs watch vs watchEffect**:

| 特性 | computed | watch | watchEffect |
|------|---------|-------|------------|
| 返回值 | 计算结果 | 无 | 无 |
| 缓存 | ✅ | ❌ | ❌ |
| 依赖收集 | 自动 | 手动指定 | 自动 |
| 立即执行 | ✅ | ❌（需配置） | ✅ |
| 访问旧值 | ❌ | ✅ | ❌ |
| 使用场景 | 基于响应式数据计算新值 | 监听特定数据，执行副作用 | 自动追踪依赖的副作用 |

---

## Composition API

### 1. setup 函数

```vue
<!-- Vue 3.0 -->
<script>
import { ref, onMounted } from 'vue'

export default {
  props: {
    message: String
  },
  setup(props, context) {
    // props: 响应式的 props
    console.log(props.message)

    // context: { attrs, slots, emit, expose }
    context.emit('custom-event')

    const count = ref(0)

    onMounted(() => {
      console.log('mounted')
    })

    // 返回的内容暴露给模板
    return {
      count
    }
  }
}
</script>

<!-- Vue 3.2+ Script Setup (推荐) -->
<script setup>
import { ref, onMounted } from 'vue'

// 自动暴露给模板，无需 return
const count = ref(0)

onMounted(() => {
  console.log('mounted')
})

// defineProps 和 defineEmits 是编译器宏，无需导入
const props = defineProps({
  message: String
})

const emit = defineEmits(['custom-event'])
</script>
```

### 2. 组合式函数 (Composables)

```javascript
// composables/useMouse.js
import { ref, onMounted, onUnmounted } from 'vue'

export function useMouse() {
  const x = ref(0)
  const y = ref(0)

  function update(event) {
    x.value = event.pageX
    y.value = event.pageY
  }

  onMounted(() => {
    window.addEventListener('mousemove', update)
  })

  onUnmounted(() => {
    window.removeEventListener('mousemove', update)
  })

  return { x, y }
}

// composables/useFetch.js
import { ref, watchEffect, toValue } from 'vue'

export function useFetch(url) {
  const data = ref(null)
  const error = ref(null)
  const loading = ref(false)

  watchEffect(async () => {
    loading.value = true
    data.value = null
    error.value = null

    try {
      const res = await fetch(toValue(url))
      data.value = await res.json()
    } catch (e) {
      error.value = e
    } finally {
      loading.value = false
    }
  })

  return { data, error, loading }
}

// 使用
<script setup>
import { useMouse } from './composables/useMouse'
import { useFetch } from './composables/useFetch'

const { x, y } = useMouse()
const { data, error, loading } = useFetch('/api/user')
</script>

<template>
  <div>Mouse: {{ x }}, {{ y }}</div>
  <div v-if="loading">Loading...</div>
  <div v-else-if="error">Error: {{ error.message }}</div>
  <div v-else>{{ data }}</div>
</template>
```

**Composables 最佳实践**:

```javascript
// ✅ 命名：use 开头
export function useCounter() {}

// ✅ 返回响应式数据
export function useCounter() {
  const count = ref(0)
  const increment = () => count.value++
  return { count, increment }
}

// ✅ 支持参数
export function useFetch(url) {
  // url 可以是 ref 或普通值
  const actualUrl = toValue(url)
}

// ✅ 副作用清理
export function useEventListener(target, event, callback) {
  onMounted(() => {
    target.addEventListener(event, callback)
  })
  onUnmounted(() => {
    target.removeEventListener(event, callback)
  })
}
```

### 3. Options API vs Composition API

```vue
<!-- Options API -->
<script>
export default {
  data() {
    return {
      count: 0,
      message: 'Hello'
    }
  },
  computed: {
    double() {
      return this.count * 2
    }
  },
  methods: {
    increment() {
      this.count++
    }
  },
  mounted() {
    console.log('mounted')
  }
}
</script>

<!-- Composition API -->
<script setup>
import { ref, computed, onMounted } from 'vue'

const count = ref(0)
const message = ref('Hello')

const double = computed(() => count.value * 2)

const increment = () => {
  count.value++
}

onMounted(() => {
  console.log('mounted')
})
</script>
```

**对比**:

| 特性 | Options API | Composition API |
|------|------------|----------------|
| 代码组织 | 按选项类型分组 | 按逻辑功能分组 |
| 类型推导 | 一般 | 更好 |
| 代码复用 | Mixin（有缺陷） | Composables |
| 学习曲线 | 平缓 | 陡峭 |
| Tree-shaking | ❌ | ✅ |
| 适用场景 | 简单组件 | 复杂逻辑、代码复用 |

---

## 虚拟 DOM 与 Diff 算法

### 1. 虚拟 DOM

```javascript
// 虚拟 DOM 对象
const vnode = {
  type: 'div',
  props: {
    id: 'app',
    class: 'container'
  },
  children: [
    {
      type: 'h1',
      children: 'Hello'
    },
    {
      type: 'p',
      children: 'World'
    }
  ]
}

// 渲染函数
h('div', { id: 'app' }, [
  h('h1', 'Hello'),
  h('p', 'World')
])
```

### 2. Diff 算法

**Vue 2 双端比较算法**:

```javascript
// oldChildren: [A, B, C, D]
// newChildren: [B, D, A, C]

// 1. 旧头 vs 新头: A !== B
// 2. 旧尾 vs 新尾: D !== C
// 3. 旧头 vs 新尾: A !== C
// 4. 旧尾 vs 新头: D !== B
// 5. 查找 B 在旧列表中的位置，移动

function updateChildren(oldCh, newCh) {
  let oldStartIdx = 0
  let newStartIdx = 0
  let oldEndIdx = oldCh.length - 1
  let newEndIdx = newCh.length - 1

  let oldStartVnode = oldCh[0]
  let oldEndVnode = oldCh[oldEndIdx]
  let newStartVnode = newCh[0]
  let newEndVnode = newCh[newEndIdx]

  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    if (sameVnode(oldStartVnode, newStartVnode)) {
      // 旧头 vs 新头
      patchVnode(oldStartVnode, newStartVnode)
      oldStartVnode = oldCh[++oldStartIdx]
      newStartVnode = newCh[++newStartIdx]
    } else if (sameVnode(oldEndVnode, newEndVnode)) {
      // 旧尾 vs 新尾
      patchVnode(oldEndVnode, newEndVnode)
      oldEndVnode = oldCh[--oldEndIdx]
      newEndVnode = newCh[--newEndIdx]
    } else if (sameVnode(oldStartVnode, newEndVnode)) {
      // 旧头 vs 新尾
      patchVnode(oldStartVnode, newEndVnode)
      // 移动节点
      nodeOps.insertBefore(parentElm, oldStartVnode.elm, nodeOps.nextSibling(oldEndVnode.elm))
      oldStartVnode = oldCh[++oldStartIdx]
      newEndVnode = newCh[--newEndIdx]
    } else if (sameVnode(oldEndVnode, newStartVnode)) {
      // 旧尾 vs 新头
      patchVnode(oldEndVnode, newStartVnode)
      nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm)
      oldEndVnode = oldCh[--oldEndIdx]
      newStartVnode = newCh[++newStartIdx]
    } else {
      // 查找 key
      const idxInOld = findIdxInOld(newStartVnode, oldCh, oldStartIdx, oldEndIdx)
      // ...
    }
  }
}
```

**Vue 3 快速 Diff 算法**:

```javascript
// 优化策略
// 1. 预处理：从头部和尾部开始同步
// 2. 处理中间不同的部分

function patchKeyedChildren(c1, c2) {
  let i = 0
  const l2 = c2.length
  let e1 = c1.length - 1 // 旧列表结束索引
  let e2 = l2 - 1        // 新列表结束索引

  // 1. 从头部开始同步
  while (i <= e1 && i <= e2) {
    const n1 = c1[i]
    const n2 = c2[i]
    if (isSameVNodeType(n1, n2)) {
      patch(n1, n2)
    } else {
      break
    }
    i++
  }

  // 2. 从尾部开始同步
  while (i <= e1 && i <= e2) {
    const n1 = c1[e1]
    const n2 = c2[e2]
    if (isSameVNodeType(n1, n2)) {
      patch(n1, n2)
    } else {
      break
    }
    e1--
    e2--
  }

  // 3. 处理新增节点
  if (i > e1) {
    if (i <= e2) {
      while (i <= e2) {
        patch(null, c2[i])
        i++
      }
    }
  }
  // 4. 处理删除节点
  else if (i > e2) {
    while (i <= e1) {
      unmount(c1[i])
      i++
    }
  }
  // 5. 处理中间不同的部分（最长递增子序列）
  else {
    // ...
  }
}
```

**Vue 3 Diff 优化**:

1. **静态提升**: 静态节点不参与 diff
2. **事件缓存**: 事件处理函数缓存
3. **Block Tree**: 只 diff 动态节点
4. **PatchFlags**: 标记动态属性类型

```vue
<template>
  <div>
    <h1>Static</h1> <!-- 静态提升 -->
    <p>{{ message }}</p> <!-- 动态节点 -->
  </div>
</template>

<!-- 编译后 -->
<script>
import { createVNode as _createVNode, toDisplayString as _toDisplayString, openBlock as _openBlock, createBlock as _createBlock } from "vue"

const _hoisted_1 = /*#__PURE__*/_createVNode("h1", null, "Static", -1 /* HOISTED */)

export function render(_ctx, _cache) {
  return (_openBlock(), _createBlock("div", null, [
    _hoisted_1,
    _createVNode("p", null, _toDisplayString(_ctx.message), 1 /* TEXT */)
  ]))
}
</script>
```

### 3. Key 的作用

```vue
<!-- ❌ 不使用 key -->
<div v-for="item in items">{{ item.name }}</div>

<!-- ✅ 使用 key -->
<div v-for="item in items" :key="item.id">{{ item.name }}</div>

<!-- ❌ 使用 index 作为 key（可能导致问题） -->
<div v-for="(item, index) in items" :key="index">{{ item.name }}</div>
```

**Key 的作用**:

1. **高效更新**: Vue 通过 key 识别节点，避免不必要的 DOM 操作
2. **状态保持**: 保持组件状态（如输入框的值）
3. **触发过渡**: 正确触发过渡效果

**问题示例**:

```vue
<!-- 删除第一项时，使用 index 作为 key -->
原数据：[{id:1, name:'A'}, {id:2, name:'B'}, {id:3, name:'C'}]
新数据：[{id:2, name:'B'}, {id:3, name:'C'}]

使用 index 作为 key:
原 key: [0, 1, 2]
新 key: [0, 1]
Vue 认为：key=0 从 A 变成 B，key=1 从 B 变成 C，删除 key=2
结果：重新渲染所有项（性能差）

使用 id 作为 key:
原 key: [1, 2, 3]
新 key: [2, 3]
Vue 认为：删除 key=1，保留 key=2 和 key=3
结果：只删除一个 DOM 节点（性能好）
```

---

## 状态管理

### 1. Pinia (Vue 3 推荐)

```javascript
// stores/counter.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Option Store
export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
    name: 'Counter'
  }),
  getters: {
    double: (state) => state.count * 2
  },
  actions: {
    increment() {
      this.count++
    },
    async fetchData() {
      const data = await fetch('/api/data')
      this.count = data.count
    }
  }
})

// Setup Store (推荐，更灵活)
export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const name = ref('Counter')

  const double = computed(() => count.value * 2)

  function increment() {
    count.value++
  }

  async function fetchData() {
    const data = await fetch('/api/data')
    count.value = data.count
  }

  return { count, name, double, increment, fetchData }
})

// 组件中使用
<script setup>
import { useCounterStore } from '@/stores/counter'
import { storeToRefs } from 'pinia'

const store = useCounterStore()

// ❌ 直接解构会失去响应式
const { count, double } = store

// ✅ 使用 storeToRefs 保持响应式
const { count, double } = storeToRefs(store)

// ✅ actions 可以直接解构
const { increment, fetchData } = store

// 订阅 state 变化
store.$subscribe((mutation, state) => {
  console.log('state changed', state)
})

// 订阅 actions
store.$onAction(({ name, store, args, after, onError }) => {
  console.log(`Action ${name} called`)

  after((result) => {
    console.log('Action finished')
  })

  onError((error) => {
    console.log('Action error', error)
  })
})

// 重置 state
store.$reset()

// 批量更新
store.$patch({
  count: 100,
  name: 'New Counter'
})

store.$patch((state) => {
  state.count = 100
  state.name = 'New Counter'
})
</script>
```

### 2. Vuex (Vue 2/3)

```javascript
// store/index.js
import { createStore } from 'vuex'

export default createStore({
  state: {
    count: 0,
    user: null
  },
  getters: {
    double: state => state.count * 2
  },
  mutations: {
    // 同步修改 state
    INCREMENT(state) {
      state.count++
    },
    SET_USER(state, user) {
      state.user = user
    }
  },
  actions: {
    // 异步操作，提交 mutation
    async fetchUser({ commit }) {
      const user = await fetch('/api/user')
      commit('SET_USER', user)
    }
  },
  modules: {
    // 模块化
    cart: {
      namespaced: true,
      state: () => ({ items: [] }),
      mutations: { /* ... */ },
      actions: { /* ... */ }
    }
  }
})

// 组件中使用
<script setup>
import { useStore } from 'vuex'
import { computed } from 'vue'

const store = useStore()

// 读取 state
const count = computed(() => store.state.count)

// 读取 getters
const double = computed(() => store.getters.double)

// 提交 mutation
const increment = () => {
  store.commit('INCREMENT')
}

// 派发 action
const fetchUser = () => {
  store.dispatch('fetchUser')
}

// 访问模块
const cartItems = computed(() => store.state.cart.items)
store.commit('cart/ADD_ITEM', item)
</script>
```

**Pinia vs Vuex**:

| 特性 | Pinia | Vuex |
|------|-------|------|
| API | 简洁 | 复杂（mutations/actions） |
| TypeScript | 更好 | 一般 |
| DevTools | 支持 | 支持 |
| 热更新 | 支持 | 支持 |
| 模块化 | 自动 | 手动配置 |
| 包大小 | 更小 | 较大 |
| Vue 版本 | Vue 3 | Vue 2/3 |

---

## 性能优化

### 1. 组件级优化

```vue
<!-- v-show vs v-if -->
<!-- v-show: 切换 display，适合频繁切换 -->
<div v-show="visible">Content</div>

<!-- v-if: 条件渲染，适合不频繁切换 -->
<div v-if="visible">Content</div>

<!-- v-once: 只渲染一次 -->
<div v-once>{{ static }}</div>

<!-- v-memo: 缓存子树（Vue 3.2+） -->
<div v-memo="[value]">
  <ExpensiveComponent :value="value" />
</div>

<!-- KeepAlive: 缓存组件 -->
<KeepAlive>
  <component :is="currentComponent" />
</KeepAlive>

<KeepAlive :include="['Home', 'About']" :max="10">
  <router-view />
</KeepAlive>
```

### 2. 列表优化

```vue
<template>
  <!-- ✅ 使用 key -->
  <div v-for="item in items" :key="item.id">
    {{ item.name }}
  </div>

  <!-- ✅ 虚拟滚动（大列表） -->
  <RecycleScroller
    :items="items"
    :item-size="50"
    key-field="id"
  >
    <template #default="{ item }">
      <div>{{ item.name }}</div>
    </template>
  </RecycleScroller>
</template>

<script setup>
import { ref, shallowRef } from 'vue'

// ✅ shallowRef: 只有 .value 是响应式的
const items = shallowRef([])

// ✅ 大数据使用 Object.freeze 冻结
const frozenData = Object.freeze(largeArray)
</script>
```

### 3. 异步组件

```vue
<script setup>
import { defineAsyncComponent } from 'vue'

// 异步加载组件
const AsyncComp = defineAsyncComponent(() =>
  import('./components/AsyncComponent.vue')
)

// 带选项的异步组件
const AsyncCompWithOptions = defineAsyncComponent({
  loader: () => import('./components/AsyncComponent.vue'),
  loadingComponent: LoadingComponent,
  errorComponent: ErrorComponent,
  delay: 200,
  timeout: 3000
})
</script>

<template>
  <Suspense>
    <AsyncComp />
    <template #fallback>
      <div>Loading...</div>
    </template>
  </Suspense>
</template>
```

### 4. 函数式组件

```vue
<!-- Vue 2 -->
<template functional>
  <div>{{ props.message }}</div>
</template>

<!-- Vue 3 -->
<script>
export default function FunctionalComp(props) {
  return h('div', props.message)
}
</script>
```

### 5. 生产构建优化

```javascript
// vite.config.js
export default {
  build: {
    // 代码分割
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'vue-router', 'pinia'],
          'ui': ['element-plus']
        }
      }
    },
    // 压缩
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
}
```

---

## Vue 3 新特性

### 1. Teleport (传送门)

```vue
<template>
  <div>
    <button @click="open = true">Open Modal</button>

    <!-- 渲染到 body -->
    <Teleport to="body">
      <div v-if="open" class="modal">
        <p>Modal Content</p>
        <button @click="open = false">Close</button>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const open = ref(false)
</script>
```

### 2. Suspense (实验性)

```vue
<template>
  <Suspense>
    <!-- 异步组件 -->
    <template #default>
      <AsyncComponent />
    </template>

    <!-- 加载状态 -->
    <template #fallback>
      <div>Loading...</div>
    </template>
  </Suspense>
</template>

<script setup>
// AsyncComponent.vue
const data = await fetch('/api/data')
</script>
```

### 3. Fragment (多根节点)

```vue
<!-- Vue 2: 必须有单一根节点 -->
<template>
  <div>
    <header>Header</header>
    <main>Main</main>
  </div>
</template>

<!-- Vue 3: 支持多根节点 -->
<template>
  <header>Header</header>
  <main>Main</main>
  <footer>Footer</footer>
</template>
```

### 4. 更好的 TypeScript 支持

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

interface User {
  id: number
  name: string
}

const user = ref<User | null>(null)

const userName = computed(() => {
  return user.value?.name ?? 'Guest'
})

// defineProps 类型推导
interface Props {
  message: string
  count?: number
}

const props = defineProps<Props>()

// defineEmits 类型推导
const emit = defineEmits<{
  update: [id: number, value: string]
  delete: [id: number]
}>()
</script>
```

---

## 面试高频问题

### 1. Vue 响应式原理

**回答要点**:

- **Vue 2**: `Object.defineProperty` 递归劫持对象属性，getter 收集依赖，setter 触发更新
- **Vue 3**: `Proxy` 代理整个对象，支持新增/删除属性，性能更好
- **依赖收集**: Watcher/Effect 订阅数据变化
- **派发更新**: 数据变化时通知订阅者，触发视图更新

### 2. Vue 2 和 Vue 3 的区别

**核心变化**:

1. **响应式**: Object.defineProperty → Proxy
2. **API**: Options API → Composition API
3. **性能**: 更快的渲染、更小的包体积
4. **新特性**: Teleport、Suspense、Fragment
5. **TypeScript**: 更好的类型支持

### 3. 双向绑定原理

```vue
<!-- v-model 本质 -->
<input v-model="text">

<!-- 等价于 -->
<input
  :value="text"
  @input="text = $event.target.value"
>
```

**实现原理**:

1. **数据 → 视图**: 响应式系统，数据变化自动更新 DOM
2. **视图 → 数据**: 监听 input 事件，更新数据

### 4. nextTick 原理

```javascript
// Vue 异步更新队列
this.message = 'changed'
console.log(this.$el.textContent) // 旧值

this.$nextTick(() => {
  console.log(this.$el.textContent) // 新值
})

// Vue 3
import { nextTick } from 'vue'

message.value = 'changed'
await nextTick()
console.log(el.textContent) // 新值
```

**原理**:

1. Vue 异步更新 DOM（批量更新，提高性能）
2. nextTick 在下次 DOM 更新后执行回调
3. 实现：优先使用 Promise → MutationObserver → setImmediate → setTimeout

### 5. computed vs methods vs watch

```vue
<script setup>
import { ref, computed, watch } from 'vue'

const count = ref(0)

// computed: 缓存，依赖变化时才重新计算
const double = computed(() => count.value * 2)

// methods: 每次都执行
const getDouble = () => count.value * 2

// watch: 监听数据变化，执行副作用
watch(count, (newVal) => {
  console.log('count changed:', newVal)
})
</script>

<template>
  <!-- computed: 调用一次 -->
  <div>{{ double }}</div>
  <div>{{ double }}</div>

  <!-- methods: 调用两次 -->
  <div>{{ getDouble() }}</div>
  <div>{{ getDouble() }}</div>
</template>
```

### 6. Vue Router 原理

**Hash 模式**:

```javascript
// URL: http://example.com/#/home

// 监听 hash 变化
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.slice(1)
  // 渲染对应组件
})

// 优点：兼容性好，不需要服务器配置
// 缺点：URL 有 #，不够美观
```

**History 模式**:

```javascript
// URL: http://example.com/home

// 监听 popstate 事件
window.addEventListener('popstate', () => {
  const path = window.location.pathname
  // 渲染对应组件
})

// 路由跳转
history.pushState(null, '', '/home')

// 优点：URL 美观
// 缺点：需要服务器配置，刷新 404
```

### 7. Vuex 数据流

```
组件 dispatch → Action (异步)
         ↓
Action commit → Mutation (同步)
         ↓
Mutation 修改 → State
         ↓
State 变化 → 组件重新渲染
```

### 8. Vue 性能优化

**编码优化**:

1. `v-if` vs `v-show`: 频繁切换用 `v-show`
2. `computed` 缓存计算结果
3. `v-for` 使用唯一 `key`
4. `KeepAlive` 缓存组件
5. 异步组件懒加载
6. 虚拟滚动处理大列表

**打包优化**:

1. 代码分割（路由懒加载）
2. 压缩代码
3. Tree-shaking
4. CDN 加载第三方库

---

## 设计模式

### 1. 插槽 (Slots)

```vue
<!-- 子组件 -->
<template>
  <div class="card">
    <!-- 默认插槽 -->
    <slot></slot>

    <!-- 具名插槽 -->
    <slot name="header"></slot>
    <slot name="footer"></slot>

    <!-- 作用域插槽 -->
    <slot name="item" :item="item" :index="index"></slot>
  </div>
</template>

<!-- 父组件 -->
<template>
  <Card>
    <!-- 默认插槽 -->
    <p>Default content</p>

    <!-- 具名插槽 -->
    <template #header>
      <h1>Header</h1>
    </template>

    <template #footer>
      <p>Footer</p>
    </template>

    <!-- 作用域插槽 -->
    <template #item="{ item, index }">
      <div>{{ index }}: {{ item.name }}</div>
    </template>
  </Card>
</template>
```

### 2. Renderless Components

```vue
<!-- Mouse.vue -->
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const x = ref(0)
const y = ref(0)

const update = (e) => {
  x.value = e.pageX
  y.value = e.pageY
}

onMounted(() => {
  window.addEventListener('mousemove', update)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', update)
})

defineSlots<{
  default: { x: number, y: number }
}>()
</script>

<template>
  <slot :x="x" :y="y"></slot>
</template>

<!-- 使用 -->
<template>
  <Mouse v-slot="{ x, y }">
    <div>Mouse: {{ x }}, {{ y }}</div>
  </Mouse>
</template>
```

### 3. 高阶组件 (HOC)

```javascript
// withLoading.js
import { h, defineComponent } from 'vue'

export function withLoading(Component) {
  return defineComponent({
    props: {
      loading: Boolean
    },
    setup(props, { attrs, slots }) {
      return () => {
        if (props.loading) {
          return h('div', 'Loading...')
        }
        return h(Component, attrs, slots)
      }
    }
  })
}

// 使用
const UserListWithLoading = withLoading(UserList)

<UserListWithLoading :loading="loading" :users="users" />
```

---

## 最佳实践

### 1. 组件设计原则

```vue
<!-- ✅ 单一职责 -->
<UserProfile>
  <UserAvatar />
  <UserInfo />
  <UserActions />
</UserProfile>

<!-- ✅ Props 验证 -->
<script setup>
defineProps({
  title: {
    type: String,
    required: true,
    validator: (value) => value.length > 0
  },
  status: {
    type: String,
    default: 'pending',
    validator: (value) => ['pending', 'active', 'inactive'].includes(value)
  }
})
</script>

<!-- ✅ 避免在 computed 中修改数据 -->
<script setup>
const fullName = computed({
  get: () => `${firstName.value} ${lastName.value}`,
  set: (value) => {
    [firstName.value, lastName.value] = value.split(' ')
  }
})
</script>
```

### 2. 代码组织

```
src/
├── assets/          # 静态资源
├── components/      # 可复用组件
│   ├── common/      # 通用组件
│   └── business/    # 业务组件
├── composables/     # 组合式函数
│   ├── useMouse.js
│   └── useFetch.js
├── views/           # 页面组件
├── router/          # 路由配置
├── stores/          # 状态管理
├── utils/           # 工具函数
├── types/           # TypeScript 类型
├── App.vue
└── main.ts
```

### 3. 命名规范

```javascript
// 组件名：PascalCase
UserProfile.vue
UserList.vue

// 文件名：kebab-case 或 PascalCase
user-profile.vue
UserProfile.vue

// Props: camelCase
<UserProfile userName="John" />

// Events: kebab-case
emit('user-updated')

// 常量: UPPER_CASE
const MAX_COUNT = 100
```

---

## 总结

### Vue 核心要点

1. **响应式系统**: 数据驱动视图自动更新
2. **组件化**: 可复用的 UI 单元
3. **虚拟 DOM**: 高效的 DOM 更新
4. **Composition API**: 更好的代码组织和复用
5. **渐进式**: 易于集成，灵活扩展

### 面试必备

- ✅ 响应式原理（Proxy vs Object.defineProperty）
- ✅ 虚拟 DOM 和 Diff 算法
- ✅ 生命周期
- ✅ 组件通信
- ✅ Composition API vs Options API
- ✅ Vue 2 vs Vue 3
- ✅ 性能优化

### 学习资源

- [Vue 3 官方文档](https://vuejs.org/)
- [Vue Router 文档](https://router.vuejs.org/)
- [Pinia 文档](https://pinia.vuejs.org/)
- [Vite 文档](https://vitejs.dev/)
