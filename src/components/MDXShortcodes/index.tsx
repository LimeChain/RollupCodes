import Section from '@components/Section'
import Labels from '@components/Labels'
import styles from './styles.module.scss'
import QuestionMarkIcon from '/public/images/question-mark-icon.svg'
import { Tooltip as TooltipComponent } from 'react-tooltip'
import Typography from '@components/Typography'
import { ChainSpecElement, ChainSpecElementStatus, ChainSpecElementsMap, Text } from '@utils/types'
import classNames from 'classnames'
import UnsupportedIcon from '/public/images/unsupported-triangle-icon.svg'
import ModifiedIcon from '/public/images/modified-triangle-icon.svg'
import AddedIcon from '/public/images/added-triangle-icon.svg'
import CopyIcon from '/public/images/copy-icon.svg'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import ReferenceIcon from '/public/images/reference-icon.svg'
import CheckmarkIcon from '/public/images/checkmark-icon.svg'
import { solidityEquivalent, systemContractUrl } from '@utils/chain-spec-info'

const Tooltip = ({ tooltip }: { tooltip: string }) => {
    const id = Math.random()
    return (
        <span
            data-tooltip-id={`${id}-tooltip`}
            data-tooltip-content={tooltip}
            className={styles.tooltip}
        >
            <QuestionMarkIcon />
            <TooltipComponent
                id={`${id}-tooltip`}
                style={{
                    background: 'var(--opposite-background-color)',
                    color: 'var(--opposite-text-color)',
                    zIndex: 1,
                    borderRadius: 0,
                    opacity: 1,
                    maxWidth: 200,
                    height: 'auto',
                    fontWeight: '400',
                }}
            />
        </span>
    )
}

const Copy = ({ value, label }: { value: string; label: string }) => {
    const [copied, setCopied] = useState<boolean>(false)
    const intervalRef: any = useRef(null)

    useEffect(() => {
        if (copied) {
            intervalRef.current = setInterval(() => setCopied(false), 1500)
        }
        return () => clearInterval(intervalRef.current)
    }, [copied])

    return (
        <div className={styles.copy} title={value}>
            {label && label}
            <CopyToClipboard text={value} onCopy={() => setCopied(true)}>
                <span className={styles.copyIcon}>
                    {copied ? <CheckmarkIcon /> : <CopyIcon />}
                </span>
            </CopyToClipboard>
        </div>
    )
}

const Parameter = ({
    name,
    value,
    tooltip,
    bordered = true,
    reference,
}: {
    name: string
    value?: string | React.ReactNode | React.ReactNode[]
    tooltip?: string
    bordered?: boolean
    reference?: string
}) => (
    <span
        className={classNames(styles.parameter, {
            [styles.bordered]: bordered && value,
        })}
    >
        <Typography
            variant={Text.BODY2}
            fontWeight="700"
            marginRight={4}
            width={'35%'}
            className={styles.additionalParameterClass}
        >
            {name}
            {reference && <Reference url={reference} />}
            {tooltip ? <Tooltip tooltip={tooltip} /> : null}
        </Typography>
        <span className={styles.parameterValue}>
            {typeof value === 'string' ? (
                <Typography
                    variant={Text.BODY2}
                    fontWeight="400"
                    color={'var(--markdown-text-color)'}
                >
                    {value}
                </Typography>
            ) : (
                value
            )}
        </span>
    </span>
)

const Legend = () => (
    <ul className={styles.legend}>
        <li className={classNames(styles.marker, styles.marker_unsupported)}>
            &#8226; Unsupported
        </li>
        <li className={classNames(styles.marker, styles.marker_modified)}>
            &#8226; Modified
        </li>
        <li className={classNames(styles.marker, styles.marker_added)}>
            &#8226; Added
        </li>
    </ul>
)

const Unsupported = () => (
    <div className={styles.stateIcon}>
        <UnsupportedIcon />
    </div>
)

const Modified = () => (
    <div className={styles.stateIcon}>
        <ModifiedIcon />
    </div>
)

const Added = () => (
    <div className={styles.stateIcon}>
        <AddedIcon />
    </div>
)

const Reference = ({ url, label }: { url: string; label?: string }) => (
    <Link href={url} target="_blank" className={styles.reference}>
        {label && (
            <Typography variant={Text.BODY2} fontWeight="400" color="inherit">
                {label}
            </Typography>
        )}
        <ReferenceIcon fill={'var(--neutral60)'} />
    </Link>
)

type MultiRowParametersData = Record<
    string,
    string | Record<string, string>[]
>[]

const MultiRowParameters = ({
    title,
    tooltip,
    data,
    bordered = true,
}: {
    title: string
    tooltip: string
    data: MultiRowParametersData
    bordered: boolean
}) => {
    return (
        <div className={styles.multiRowContainer}>
            <Typography
                variant={Text.BODY2}
                fontWeight="700"
                className={styles.additionalParameterClass}
                marginBottom={12}
            >
                {title}
                {tooltip ? <Tooltip tooltip={tooltip} /> : null}
            </Typography>
            {data?.map((row: any, index: number) => (
                <div
                    key={`row-${index}`}
                    className={classNames(styles.multiRow, {
                        [styles.bordered]: bordered,
                    })}
                >
                    <Typography
                        variant={Text.BODY2}
                        fontWeight="700"
                        marginRight={4}
                        width={'26%'}
                        className={styles.additionalParameterClass}
                    >
                        {row?.title}
                        {row?.reference && <Reference url={row?.reference} />}
                    </Typography>
                    <div className={styles.multiRowValues}>
                        {row?.rows?.map((row: any, index: number) => (
                            <div
                                key={`inner-row-${index}`}
                                className={styles.multiRowValue}
                            >
                                <Typography
                                    variant={Text.BODY2}
                                    fontWeight="700"
                                    marginRight={4}
                                    width={'25%'}
                                >
                                    {row?.label}
                                    {row?.tooltip && (
                                        <Tooltip tooltip={row?.tooltip} />
                                    )}
                                </Typography>
                                <Typography
                                    variant={Text.BODY2}
                                    fontWeight="400"
                                    color={'var(--markdown-text-color)'}
                                >
                                    {row?.value}
                                </Typography>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}

const getElementStatus = (data: ChainSpecElement): ChainSpecElementStatus => {
    const rollupDesc = data.description
    const ethDesc = data.ethDescription

    if (!rollupDesc) {
        return ChainSpecElementStatus.Unsupported
    } else if (!ethDesc) {
        return ChainSpecElementStatus.Added
    } else {
        return ChainSpecElementStatus.Modified
    }
}

const getStatus = (data: ChainSpecElement) => {
    switch (getElementStatus(data)) {
        case ChainSpecElementStatus.Unsupported: return Unsupported();
        case ChainSpecElementStatus.Modified: return Modified();
        case ChainSpecElementStatus.Added: return Added();
    }
}

const sortTableData = (type: string) => {
    if (type === "opcodes") {
        // Sort by opcode number
        return function ([opcode1]: [string, ChainSpecElement], [opcode2]: [string, ChainSpecElement]) {
            return parseInt(opcode1, 16) - parseInt(opcode2, 16)
        }
    } else {
        // Sort by status first: Unsupported > Modified > Added
        // Sort alphabetically after that
        return function ([address1, data1]: [string, ChainSpecElement], [address2, data2]: [string, ChainSpecElement]) {
            const status1 = getElementStatus(data1)
            const status2 = getElementStatus(data2)
            if (status1 === status2) {
                return parseInt(address1, 16) - parseInt(address2, 16)
            } else {
                return status1 - status2
            }
        }
    }
}

const shortAddress = (address: string) => {
    if (address.length < 6) {
        return address
    } else {
        return address.slice(0, 5) + "..." + address.slice(-2)
    }
}

const displayTableElementName = (type: string, name: string) => {
    if (type === "opcodes") {
        return name
    } else if (type === "precompiles") {
        return (<code>{name}</code>)
    } else {
        const url = systemContractUrl(name)
        return url ? Reference({ url, label: name }) : name
    }
}

const displaySolidityEquivalent = (opcode: string) => {
    const text = solidityEquivalent(opcode)
    return (
        <td align='left'>
            {(text) ? <code>{text}</code> : ""}
        </td>)
}

const Table = ({
    data,
    type
}: {
    data: ChainSpecElementsMap,
    type: string
}) => {
    // Only show different data
    const filteredData = Object.entries(data)
        .filter(([_, data]) => data.description !== data.ethDescription)

    let visualizedType
    if (type === "opcodes") {
        visualizedType = "OPCODEs"
    } else if (type === "precompiles") {
        visualizedType = "precompiled contracts"
    } else {
        visualizedType = "system contracts"
    }

    return (Object.keys(filteredData).length > 0)
        ? (
            <div>
                <Legend/>
                <p>The following {visualizedType} behave differently compared to the canonical Ethereum L1</p>
                <table>
                    <thead>
                        <tr>
                            <th align='left'>{type === "opcodes" ? "Opcode" : "Address"}</th>
                            <th align='left'>Name</th>
                            {type === "opcodes" ? (<th align='left'>Solidity Equivalent</th>) : ""}
                            <th align='left'>Rollup Behaviour</th>
                            <th align='left'>Ethereum L1 Behaviour</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData
                            .sort(sortTableData(type))
                            .map(([id, element]) => {
                                return (
                                    <tr key={id}>
                                        <td align='left'>{type === "opcodes" ? id : Copy({ value: id, label: shortAddress(id) })}</td>
                                        <td align='left'>{displayTableElementName(type, element.name)}</td>
                                        {type === "opcodes" ? displaySolidityEquivalent(element.name) : ""}
                                        <td align='left'>{element.description || "N/A"}</td>
                                        <td align='left'>{element.ethDescription || "N/A"} {getStatus(element)}</td>
                                    </tr>
                                )
                            })}
                    </tbody>
                </table>
            </div>
        )
        : (<p>All {visualizedType} defined in the canonical Ethereum L1 implementation have the same behaviour on the Rollup.</p>)
}

const MDXShortcodes = {
    Labels,
    Section,
    Parameter,
    Legend,
    Tooltip,
    Unsupported,
    Modified,
    Added,
    Copy,
    Reference,
    MultiRowParameters,
    Table
}

export default MDXShortcodes
