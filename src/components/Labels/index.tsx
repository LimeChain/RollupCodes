import Label from '@components/Label'
import styles from './styles.module.scss'

interface ILabels {
    labels: string[]
    title: string
}

const rollupsFirstColors: Record<string, string> = {
    abstract: '#7A8FFF',
    arbitrum_one: '#F59762',
    base: '#F59762',
    blast: '#F59762',
    ink: '#F59762',
    kakarot: '#7A8FFF',
    linea: '#7A8FFF',
    optimism: '#F59762',
    polygon_zkevm: '#7A8FFF',
    scroll: '#7A8FFF',
    soneium: '#F59762',
    taiko: '#F59762',
    world_chain: '#F59762',
    zircuit: '#7A8FFF',
    zksync_era: '#7A8FFF',
}

const getRollupFirstColor = (value: string): string =>
    rollupsFirstColors[value.toLowerCase().replace(' ', '_')]

const getNetworkColor = (value: string): string => {
    return value === "Mainnet" ? '#C400F5' : '#8A7500'
}

const Labels = ({ labels, title }: ILabels) => {
    const colors = [
        getRollupFirstColor(title),
        '#69DC6E',
        getNetworkColor(labels[2]),
        '#DF1FA9',
        '#DDA411',
        '#00AB82',
    ]
    return (
        <div className={styles.labels}>
            {labels?.map((label: string, index: number) => (
                <Label
                    key={`label-${index}`}
                    text={label}
                    color={colors[index >= 7 ? index % 7 : index]}
                />
            ))}
        </div>
    )
}

export default Labels
