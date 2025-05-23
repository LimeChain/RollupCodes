import Typography from '@components/Typography'
import styles from './styles.module.scss'
import { Headings, Text } from '@utils/types'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import Image from 'next/image'

const MCPSection = () => {
    const { theme } = useTheme()

    return (
        <div className={styles.mpc_section_container}>
            <div className={styles.mpc_section_image}>
                <Image
                    src={`/images/armadillo-${theme}.png`}
                    alt="Armadillo"
                    width={311}
                    height={334}
                />
            </div>
            <div className={styles.mpc_section_content}>
                <div className={styles.mpc_section_content_text}>
                    <Typography
                        variant={Headings.H3}
                        marginBottom={16}
                        fontWeight="700"
                    >
                        Get RollupCodes MCP
                    </Typography>
                    <Typography variant={Text.BODY2} fontWeight="400">
                        RollupCodes now has its own mcp server that feeds your
                        favorite AI with the latest L2 development knowledge!
                        Add the RollupCodes mcp to your favorite AI-powered
                        development tools such as Cursor and Claude.
                    </Typography>

                    <Link
                        href="https://github.com/LimeChain/rollup-codes-mcp"
                        target="_blank"
                        className={styles.button}
                    >
                        <Typography
                            variant={Text.BODY2}
                            fontWeight="700"
                            color={'var(--neutral100)'}
                        >
                            Get RollupCodes MCP
                        </Typography>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default MCPSection
