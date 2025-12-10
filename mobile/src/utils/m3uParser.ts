import {Channel} from '../types';

export const parseM3U = (m3uContent: string): Channel[] => {
  const channels: Channel[] = [];
  const lines = m3uContent.split('\n');
  
  let currentChannel: Partial<Channel> | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('#EXTINF:')) {
      // Parse EXTINF line
      const info = line.substring(8);
      const match = info.match(/^(-?\d+)(?:\s+(.+))?$/);
      
      if (match) {
        const attributes = match[2] || '';
        const nameMatch = attributes.match(/^(.+?)(?:\s*,\s*(.+))?$/);
        const channelName = nameMatch ? (nameMatch[2] || nameMatch[1]).trim() : '';
        
        // Extract attributes
        const tvgIdMatch = attributes.match(/tvg-id="([^"]+)"/);
        const tvgNameMatch = attributes.match(/tvg-name="([^"]+)"/);
        const tvgLogoMatch = attributes.match(/tvg-logo="([^"]+)"/);
        const groupMatch = attributes.match(/group-title="([^"]+)"/);
        
        currentChannel = {
          name: channelName,
          tvgId: tvgIdMatch ? tvgIdMatch[1] : undefined,
          tvgName: tvgNameMatch ? tvgNameMatch[1] : undefined,
          tvgLogo: tvgLogoMatch ? tvgLogoMatch[1] : undefined,
          group: groupMatch ? groupMatch[1] : undefined,
          isHD: /HD|1080|720/i.test(channelName) || /HD|1080|720/i.test(attributes),
        };
      }
    } else if (line && !line.startsWith('#') && currentChannel) {
      // URL line
      currentChannel.url = line;
      channels.push(currentChannel as Channel);
      currentChannel = null;
    }
  }
  
  return channels;
};

export const getCategories = (channels: Channel[]): string[] => {
  const categories = new Set<string>();
  channels.forEach(channel => {
    if (channel.group) {
      categories.add(channel.group);
    }
  });
  return Array.from(categories).sort();
};

