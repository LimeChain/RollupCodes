import WebsiteIcon from 'public/images/website-icon.svg'
import DocsIcon from 'public/images/docs-icon.svg'
import L2BeatIcon from 'public/images/l2beat-icon.svg'
import GithubIcon from 'public/images/github-icon.svg'
import TwitterIcon from 'public/images/twitter-icon.svg'
import DiscordIcon from 'public/images/discord-icon.svg'

const icons: Record<string, any> = {
    website: <WebsiteIcon fill={'var(--text-color)'} />,
    docs: <DocsIcon fill={'var(--text-color)'} />,
    l2beat: <L2BeatIcon fill={'var(--text-color)'} />,
    github: <GithubIcon fill={'var(--text-color)'} />,
    twitter: <TwitterIcon fill={'var(--text-color)'} />,
    discord: <DiscordIcon fill={'var(--text-color)'} />,
}

export default icons
