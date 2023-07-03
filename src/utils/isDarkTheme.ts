import { useTheme } from "next-themes"
import { ThemeMode } from "./types"

const isDarkTheme = (): boolean => {
    const { theme } = useTheme()
    return ThemeMode[ThemeMode.DARK].toLowerCase() === theme
}

export default isDarkTheme