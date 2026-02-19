import fs from 'fs'
import path from 'path'
import { ExitHatchSpec, ExitHatchSummary } from './types'

/**
 * Load exit hatch specification for a specific network
 * @param slug Network slug (e.g., 'optimism', 'arbitrum-one')
 * @returns Exit hatch spec or null if not found
 */
export function loadExitHatchSpec(slug: string): ExitHatchSpec | null {
    const specPath = path.join(
        process.cwd(),
        'src',
        'data',
        'exit-hatch',
        `${slug}.json`
    )

    if (!fs.existsSync(specPath)) {
        return null
    }

    try {
        const content = fs.readFileSync(specPath, 'utf8')
        return JSON.parse(content) as ExitHatchSpec
    } catch (error) {
        console.error(`Error loading exit hatch spec for ${slug}:`, error)
        return null
    }
}

/**
 * Get all available exit hatch network slugs
 * @returns Array of network slugs
 */
export function getAllExitHatchSlugs(): string[] {
    const specsDir = path.join(process.cwd(), 'src', 'data', 'exit-hatch')

    if (!fs.existsSync(specsDir)) {
        return []
    }

    try {
        return fs
            .readdirSync(specsDir)
            .filter(file => file.endsWith('.json'))
            .map(file => file.replace('.json', ''))
            .sort()
    } catch (error) {
        console.error('Error reading exit hatch directory:', error)
        return []
    }
}

/**
 * Load all exit hatch specifications
 * @returns Array of all exit hatch specs
 */
export function loadAllExitHatchSpecs(): ExitHatchSpec[] {
    const slugs = getAllExitHatchSlugs()

    return slugs
        .map(slug => loadExitHatchSpec(slug))
        .filter((spec): spec is ExitHatchSpec => spec !== null)
        .sort((a, b) => a.network_display.name.localeCompare(b.network_display.name))
}

/**
 * Generate a summary object from exit hatch spec (for network selector)
 * @param spec Exit hatch specification
 * @returns Summary object
 */
export function generateExitHatchSummary(spec: ExitHatchSpec): ExitHatchSummary {
    return {
        slug: spec.network,
        network: spec.network,
        chain_id: spec.chain_id,
        name: spec.network_display.name,
        icon: spec.network_display.icon,
        color: spec.network_display.color,
        total_estimated_time: spec.withdrawal_flow.total_estimated_time
    }
}

/**
 * Get exit hatch spec by network query parameter
 * @param networkParam Network parameter from URL query
 * @param allSpecs All available specs
 * @returns Matching spec or first spec as default
 */
export function getSpecByNetworkParam(
    networkParam: string | string[] | undefined,
    allSpecs: ExitHatchSpec[]
): ExitHatchSpec | null {
    if (!allSpecs || allSpecs.length === 0) {
        return null
    }

    // Handle array of params (take first)
    const network = Array.isArray(networkParam) ? networkParam[0] : networkParam

    // Find matching network
    if (network) {
        const found = allSpecs.find(
            spec => spec.network === network || spec.network_display.slug === network
        )
        if (found) {
            return found
        }
    }

    // Default to first network
    return allSpecs[0]
}

/**
 * Validate exit hatch spec structure
 * @param spec Exit hatch specification
 * @returns True if valid, false otherwise
 */
export function validateExitHatchSpec(spec: any): spec is ExitHatchSpec {
    return (
        spec &&
        typeof spec === 'object' &&
        spec.schema_version &&
        spec.network &&
        spec.chain_id &&
        spec.network_display &&
        spec.supported_asset &&
        spec.bridge_contracts &&
        spec.withdrawal_flow &&
        spec.validation &&
        spec.ui_text &&
        Array.isArray(spec.documentation_urls)
    )
}
