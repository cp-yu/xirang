import type { RelationDefinition } from './registry.js';
import { z } from 'zod';

export const ACTIVE_RELATION_TYPES = [
  'invokes',
  'produces',
  'consumes',
  'precedes',
  'constrains',
  'validates',
] as const;

export type ActiveRelationType = typeof ACTIVE_RELATION_TYPES[number];
export type ActiveRelationEndpointKind = 'generic' | 'element';

type RelationDescription = Omit<RelationDefinition, 'type' | 'fromKinds' | 'toKinds' | 'example'>;

export interface ActiveRelationDefinition extends RelationDescription {
  type: ActiveRelationType;
  fromKinds: readonly ActiveRelationEndpointKind[];
  toKinds: readonly ActiveRelationEndpointKind[];
  example: {
    from: string;
    type: ActiveRelationType;
    to: string;
    note?: string;
  };
}

const genericToElement = {
  fromKinds: ['generic'],
  toKinds: ['element'],
} as const;

const optionalNote = { allowed: true, maxLength: 200 } as const;

export const ActiveRelationDefinitionRegistry = [
  {
    type: 'invokes',
    ...genericToElement,
    direction: 'caller → callee',
    meaning: '调用方主动触发被调用方执行。',
    useWhen: '一个 element 在运行时主动调用另一个 element。',
    doNotUseWhen: '仅消费数据、配置、制品或合同而不主动触发执行。',
    propagationHint: '调用方变化需验证被调用方合同；被调用方变化需验证调用方。',
    notePolicy: optionalNote,
    example: { from: 'element.cli.sync', type: 'invokes', to: 'element.xirang.merge' },
  },
  {
    type: 'produces',
    ...genericToElement,
    direction: 'producer → output',
    meaning: '生产方创建或发布目标 element 表示的数据、事件、制品或合同。',
    useWhen: '交互核心是创建或发布目标 element。',
    doNotUseWhen: '目标只是被读取、调用或按时序排列。',
    propagationHint: '输出合同变化需验证生产方和消费者。',
    notePolicy: optionalNote,
    example: { from: 'element.change.apply', type: 'produces', to: 'element.architecture.delta' },
  },
  {
    type: 'consumes',
    ...genericToElement,
    direction: 'consumer → provider',
    meaning: '消费方读取提供方的数据、配置、制品或合同。',
    useWhen: '交互核心是读取或依赖提供内容。',
    doNotUseWhen: '消费方主动触发提供方执行。',
    propagationHint: '提供方合同变化需验证消费方。',
    notePolicy: optionalNote,
    example: { from: 'element.cli.help', type: 'consumes', to: 'element.architecture.model' },
  },
  {
    type: 'precedes',
    ...genericToElement,
    direction: 'earlier → later',
    meaning: '前置 element 必须先于后续 element 完成。',
    useWhen: '执行顺序是正确性合同。',
    doNotUseWhen: '顺序只是实现偶然或性能偏好。',
    propagationHint: '任一阶段变化需验证相邻时序合同。',
    notePolicy: optionalNote,
    example: { from: 'element.change.verify', type: 'precedes', to: 'element.change.archive' },
  },
  {
    type: 'constrains',
    ...genericToElement,
    direction: 'constraint owner → constrained element',
    meaning: '约束拥有方限制目标 element 的合法行为。',
    useWhen: '存在独立且稳定的行为约束。',
    doNotUseWhen: '仅表示调用、数据消费或执行顺序。',
    propagationHint: '约束变化需验证受约束方，受约束方变化需复核约束。',
    notePolicy: optionalNote,
    example: { from: 'element.config.schema', type: 'constrains', to: 'element.config.load' },
  },
  {
    type: 'validates',
    ...genericToElement,
    direction: 'validator → subject',
    meaning: '验证方判定目标 element 或其输出是否有效。',
    useWhen: '交互结果是明确的有效性判定。',
    doNotUseWhen: '仅运行测试、调用目标或消费其输出。',
    propagationHint: '目标合同变化需验证验证方覆盖，验证规则变化需复核目标。',
    notePolicy: optionalNote,
    example: { from: 'element.validation.xirang', type: 'validates', to: 'element.xirang.merge' },
  },
] as const satisfies readonly ActiveRelationDefinition[];

export const ActiveRelationTypeSchema = z.enum(ACTIVE_RELATION_TYPES);

export function getActiveRelationDefinition(type: ActiveRelationType): ActiveRelationDefinition {
  return ActiveRelationDefinitionRegistry.find((definition) => definition.type === type)!;
}
