import React from 'react'

export interface IMetadata {
    title: string
    description: string
}

export type FontWeight =
    | '100'
    | '200'
    | '300'
    | '400'
    | '500'
    | '600'
    | '700'
    | '800'
    | '900'

export enum Headings {
    H1 = 'h1',
    H2 = 'h2',
    H3 = 'h3',
    H4 = 'h4',
    H5 = 'h5',
    H6 = 'h6'
}

export enum Text {
    BODY1 = 'body1',
    BODY2 = 'body2',
    BODY3 = 'body3',
    BODY4 = 'body4',
}

export type TextAlign =
    | 'start'
    | 'end'
    | 'left'
    | 'right'
    | 'center'
    | 'justify'
    | 'match-parent'

export type FontStyle = 'normal' | 'italic'

export enum Font {
    Inter,
    ChakraPetch
}

export type TextTransform = 'none' | 'uppercase' | 'capitalize' | 'lowercase'

export type BreakWord =  'normal' | 'break-all' | 'keep-all' | 'break-word '| 'inherit' | 'initial' | 'revert' | 'revert-layer' | 'unset'

export interface ITypography {
    variant: Headings | Text
    fontWeight?: FontWeight
    textAlign?: TextAlign
    marginBottom?: number
    marginTop?: number
    marginRight?: number
    marginLeft?: number
    fontStyle?: FontStyle
    children: string | React.ReactNode
    className?: string
    font?: Font
    textTransform?: TextTransform
    color?: string
    letterSpacing?: string
    fontSize?: string
    breakWord?: BreakWord
    width?: string
    lineHeight?: string
}

export interface IDocMeta {
    title: string
    subtitle: string
    lightLogo: string
    darkLogo?: string
    slug: string
    labels: string[]
    links: Links
    lastModified?: string
}

export enum AvatarSize {
    SMALL,
    LARGE,
}

export enum ThemeMode {
    LIGHT,
    DARK
}

export interface ILink {
    name: string
    url: string
}

export type Links = Record<string, ILink>

export interface ICrumb {
    href: string
    title: string
    last?: boolean
}

export type Breadcrumbs = ICrumb[]

export type ExecutionEnvironmentsMap = {
    [env: string]: CustomChainSpec
}

export type CustomChainSpec = {
    opcodes: ChainSpecElementsMap,
    precompiles: ChainSpecElementsMap,
    system_contracts: ChainSpecElementsMap
}

export type ChainSpecElementsMap = {
    [index: string]: ChainSpecElement
}

export type ChainSpecElement = {
    name: string,
    description?: string,
    ethDescription?: string,
    url?: string
}

export enum ChainSpecElementStatus {
    Unsupported = 1,
    Modified = 2,
    Added = 3
}

// Exit Hatch Types
export interface NetworkDisplay {
    name: string
    slug: string
    icon: string
    color: string
    l2_chain_id: number
    l1_chain_id: number
    l1_network_name: string
    rpc_url: string
    explorer_url: string
}

export interface SupportedAsset {
    symbol: string
    name: string
    decimals: number
    is_native: boolean
    l2_address: string
    l1_address: string
}

export interface BridgeContract {
    address: string
    name: string
    explorer_url: string
}

export interface BridgeContracts {
    l2_bridge: BridgeContract
    l1_portal?: BridgeContract
    l1_outbox?: BridgeContract
}

export interface WithdrawalStep {
    id: string
    order: number
    name: string
    description: string
    network: 'l2' | 'l1'
    contract_address?: string
    contract_name?: string
    method?: string
    user_action_required: 'sign_transaction' | 'wait'
    estimated_time: string
    estimated_gas?: string
    ui_button_text?: string
    ui_status_messages: {
        pending: string
        success: string
        error?: string
        info?: string
    }
}

export interface WithdrawalFlow {
    total_estimated_time: string
    challenge_period_days: number
    steps: WithdrawalStep[]
}

export interface DestinationNetwork {
    fixed: boolean
    chain_id: number
    name: string
}

export interface Validation {
    min_withdrawal_amount_eth: string
    max_withdrawal_amount_eth: string | null
    requires_wallet_connection: boolean
    supported_wallets: string[]
    destination_network: DestinationNetwork
}

export interface UIText {
    page_title: string
    page_description: string
    connect_wallet_prompt: string
    tabs: {
        new_withdrawal: string
        pending: string
    }
    form_labels: {
        from: string
        to: string
        amount: string
        to_address: string
        balance_label: string
        max_button: string
    }
    button_states: {
        connect_wallet: string
        select_network: string
        enter_amount: string
        move_funds: string
    }
    transaction_modal: {
        title: string
        withdrawal_amount_label: string
        source_network_label: string
        recipient_network_label: string
        estimated_time_label: string
        confirm_button: string
        cancel_button: string
    }
    notifications: {
        connecting_wallet: string
        wallet_connected: string
        transaction_pending: string
        transaction_confirmed: string
    }
}

export interface DocumentationUrl {
    label: string
    url: string
}

export interface ExitHatchSpec {
    schema_version: string
    network: string
    chain_id: number
    last_updated: string
    network_display: NetworkDisplay
    supported_asset: SupportedAsset
    bridge_contracts: BridgeContracts
    withdrawal_flow: WithdrawalFlow
    validation: Validation
    ui_text: UIText
    documentation_urls: DocumentationUrl[]
}

export interface ExitHatchSummary {
    slug: string
    network: string
    chain_id: number
    name: string
    icon: string
    color: string
    total_estimated_time: string
}

export interface ExitHatchPageProps {
    allNetworks: ExitHatchSpec[]
    networkSlugs: string[]
}
