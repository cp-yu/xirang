import { z } from 'zod';

export const RELATION_TYPES = [
  'belongs_to',
  'invokes',
  'consumes',
  'precedes',
  'constrains',
  'validates',
] as const;

export type RelationType = typeof RELATION_TYPES[number];
export type RelationEndpointKind = 'capability' | 'domain';

export interface RelationDefinition {
  type: RelationType;
  fromKinds: readonly RelationEndpointKind[];
  toKinds: readonly RelationEndpointKind[];
  direction: string;
  meaning: string;
  useWhen: string;
  doNotUseWhen: string;
  propagationHint: string;
  notePolicy: {
    allowed: boolean;
    maxLength: number;
  };
  example: {
    from: string;
    type: RelationType;
    to: string;
    note?: string;
  };
}

const capabilityToDomain = {
  fromKinds: ['capability'],
  toKinds: ['domain'],
} as const;

const capabilityToCapability = {
  fromKinds: ['capability'],
  toKinds: ['capability'],
} as const;

const optionalNote = { allowed: true, maxLength: 200 } as const;

export const RelationDefinitionRegistry = [
  {
    type: 'belongs_to',
    ...capabilityToDomain,
    direction: 'capability → domain',
    meaning: '声明 capability 的唯一 domain 归属。',
    useWhen: '记录 capability 的架构所有权。',
    doNotUseWhen: '表达调用、消费、时序、约束或验证。',
    propagationHint: '仅提供 domain context，不传播变更影响。',
    notePolicy: { allowed: false, maxLength: 0 },
    example: { from: 'cap.cli.help', type: 'belongs_to', to: 'dom.cli' },
  },
  {
    type: 'invokes',
    ...capabilityToCapability,
    direction: 'caller → callee',
    meaning: '调用方主动触发被调用方执行。',
    useWhen: '一个 capability 在运行时主动调用另一个 capability。',
    doNotUseWhen: '仅消费数据、配置或合同而不主动触发执行。',
    propagationHint: '调用方变化需验证被调用方合同；被调用方变化需验证调用方。',
    notePolicy: optionalNote,
    example: { from: 'cap.cli.sync', type: 'invokes', to: 'cap.opsx.merge' },
  },
  {
    type: 'consumes',
    ...capabilityToCapability,
    direction: 'consumer → provider',
    meaning: '消费方读取提供方的数据、配置、制品或合同。',
    useWhen: '交互核心是读取或依赖提供内容。',
    doNotUseWhen: '消费方主动触发提供方执行。',
    propagationHint: '提供方合同变化需验证消费方。',
    notePolicy: optionalNote,
    example: { from: 'cap.cli.help', type: 'consumes', to: 'cap.opsx.relations' },
  },
  {
    type: 'precedes',
    ...capabilityToCapability,
    direction: 'earlier → later',
    meaning: '前置 capability 必须先于后续 capability 完成。',
    useWhen: '执行顺序是正确性合同。',
    doNotUseWhen: '顺序只是实现偶然或性能偏好。',
    propagationHint: '任一阶段变化需验证相邻时序合同。',
    notePolicy: optionalNote,
    example: { from: 'cap.change.verify', type: 'precedes', to: 'cap.change.archive' },
  },
  {
    type: 'constrains',
    ...capabilityToCapability,
    direction: 'constraint owner → constrained capability',
    meaning: '约束拥有方限制目标 capability 的合法行为。',
    useWhen: '存在独立且稳定的行为约束。',
    doNotUseWhen: '仅表示调用、数据消费或执行顺序。',
    propagationHint: '约束变化需验证受约束方，受约束方变化需复核约束。',
    notePolicy: optionalNote,
    example: { from: 'cap.config.schema', type: 'constrains', to: 'cap.config.load' },
  },
  {
    type: 'validates',
    ...capabilityToCapability,
    direction: 'validator → subject',
    meaning: '验证方判定目标 capability 或其输出是否有效。',
    useWhen: '交互结果是明确的有效性判定。',
    doNotUseWhen: '仅运行测试、调用目标或消费其输出。',
    propagationHint: '目标合同变化需验证验证方覆盖，验证规则变化需复核目标。',
    notePolicy: optionalNote,
    example: { from: 'cap.validation.opsx', type: 'validates', to: 'cap.opsx.merge' },
  },
] as const satisfies readonly RelationDefinition[];

export const RelationTypeSchema = z.enum(RELATION_TYPES);

export function getRelationDefinition(type: RelationType): RelationDefinition {
  return RelationDefinitionRegistry.find((definition) => definition.type === type)!;
}
