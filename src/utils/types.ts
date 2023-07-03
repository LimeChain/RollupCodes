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

export type Textaligh =
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

export type TextTrnasform = 'none' | 'uppercase' | 'capitalize' | 'lowercase'

export type BreakWord =  'normal' | 'break-all' | 'keep-all' | 'break-word '| 'inherit' | 'initial' | 'revert' | 'revert-layer' | 'unset'

export interface ITypography {
    variant: Headings | Text
    fontWeight?: FontWeight
    textAlign?: Textaligh
    marginBottom?: number
    marginTop?: number
    marginRight?: number
    marginLeft?: number
    fontStyle?: FontStyle
    children: string | React.ReactNode
    className?: string
    font?: Font
    textTransform?: TextTrnasform
    color?: string
    letterSpacing?: string
    fontSize?: string
    breakWord?: BreakWord
    width?: string
}

export interface IDocMeta {
    title: string
    subtitle: string
    logo: string
    slug: string
    labels: string[]
    links: Links
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