"use client";

/**
 * Input 组件库统一导出文件
 *
 * 这个模块包含了 Scaffold-ETH 2 中所有的输入组件，
 * 用于与智能合约交互时的数据输入。
 *
 * 包含的组件：
 * - AddressInput: 以太坊地址输入（支持 ENS 双向解析）
 * - Bytes32Input: 32 字节固定长度数据输入
 * - BytesInput: 可变长度字节数组输入
 * - EtherInput: 以太币金额输入（支持 ETH/USD 切换）
 * - InputBase: 基础输入组件（其他输入组件的基础）
 * - IntegerInput: 整数输入（支持所有 Solidity 整数类型）
 * - utils: 工具函数和类型定义（如 isValidInteger、isENS 等）
 *
 * 所有组件都支持：
 * - 实时验证
 * - 错误状态显示
 * - 禁用状态
 * - 自定义样式
 *
 * @example
 * import { AddressInput, EtherInput, IntegerInput } from "~~/components/scaffold-eth";
 */

export * from "./AddressInput";
export * from "./Bytes32Input";
export * from "./BytesInput";
export * from "./EtherInput";
export * from "./InputBase";
export * from "./IntegerInput";
export * from "./utils";
