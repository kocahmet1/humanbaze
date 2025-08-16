import React from 'react';
import { View } from 'react-native';
import {
  Home,
  Search,
  Plus,
  User,
  Clock,
  MessageCircle as MessageCircleIcon,
  Users,
  Tag,
  ThumbsUp,
  ThumbsDown,
  Share,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  Image,
  Video,
  Link,
  Quote,
  Heart,
  Edit3,
  Camera,
  Settings,
  ArrowLeft,
} from 'lucide-react';

// Modern icon components using Lucide React
interface IconProps {
  color?: string;
  size?: number;
}

// Helper component to wrap Lucide icons for React Native compatibility
const IconWrapper: React.FC<{ children: React.ReactNode; size: number }> = ({ children, size }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    {children}
  </View>
);

export const HomeIcon: React.FC<IconProps> = ({ color = '#000', size = 24 }) => (
  <IconWrapper size={size}>
    <Home color={color} size={size} />
  </IconWrapper>
);

export const DiscoverIcon: React.FC<IconProps> = ({ color = '#000', size = 24 }) => (
  <IconWrapper size={size}>
    <Search color={color} size={size} />
  </IconWrapper>
);

export const CreateIcon: React.FC<IconProps> = ({ color = '#000', size = 24 }) => (
  <IconWrapper size={size}>
    <Plus color={color} size={size} />
  </IconWrapper>
);

export const ProfileIcon: React.FC<IconProps> = ({ color = '#000', size = 24 }) => (
  <IconWrapper size={size}>
    <User color={color} size={size} />
  </IconWrapper>
);

export const HistoryIcon: React.FC<IconProps> = ({ color = '#000', size = 24 }) => (
  <IconWrapper size={size}>
    <Clock color={color} size={size} />
  </IconWrapper>
);

export const CommentsIcon: React.FC<IconProps> = ({ color = '#000', size = 24 }) => (
  <IconWrapper size={size}>
    <MessageCircleIcon color={color} size={size} />
  </IconWrapper>
);

export const UsersIcon: React.FC<IconProps> = ({ color = '#000', size = 24 }) => (
  <IconWrapper size={size}>
    <Users color={color} size={size} />
  </IconWrapper>
);

export const TagIcon: React.FC<IconProps> = ({ color = '#000', size = 24 }) => (
  <IconWrapper size={size}>
    <Tag color={color} size={size} />
  </IconWrapper>
);

export const LikeIcon: React.FC<IconProps> = ({ color = '#000', size = 24 }) => (
  <IconWrapper size={size}>
    <ThumbsUp color={color} size={size} />
  </IconWrapper>
);

export const DislikeIcon: React.FC<IconProps> = ({ color = '#000', size = 24 }) => (
  <IconWrapper size={size}>
    <ThumbsDown color={color} size={size} />
  </IconWrapper>
);

export const ShareIcon: React.FC<IconProps> = ({ color = '#000', size = 24 }) => (
  <IconWrapper size={size}>
    <Share color={color} size={size} />
  </IconWrapper>
);

export const ReportIcon: React.FC<IconProps> = ({ color = '#000', size = 24 }) => (
  <IconWrapper size={size}>
    <AlertTriangle color={color} size={size} />
  </IconWrapper>
);

export const ExpandIcon: React.FC<IconProps> = ({ color = '#000', size = 24 }) => (
  <IconWrapper size={size}>
    <ChevronDown color={color} size={size} />
  </IconWrapper>
);

export const CollapseIcon: React.FC<IconProps> = ({ color = '#000', size = 24 }) => (
  <IconWrapper size={size}>
    <ChevronUp color={color} size={size} />
  </IconWrapper>
);

export const MenuIcon: React.FC<IconProps> = ({ color = '#000', size = 24 }) => (
  <IconWrapper size={size}>
    <Menu color={color} size={size} />
  </IconWrapper>
);

export const CloseIcon: React.FC<IconProps> = ({ color = '#000', size = 24 }) => (
  <IconWrapper size={size}>
    <X color={color} size={size} />
  </IconWrapper>
);

export const ImageIcon: React.FC<IconProps> = ({ color = '#000', size = 24 }) => (
  <IconWrapper size={size}>
    <Image color={color} size={size} />
  </IconWrapper>
);

export const VideoIcon: React.FC<IconProps> = ({ color = '#000', size = 24 }) => (
  <IconWrapper size={size}>
    <Video color={color} size={size} />
  </IconWrapper>
);

export const LinkIcon: React.FC<IconProps> = ({ color = '#000', size = 24 }) => (
  <IconWrapper size={size}>
    <Link color={color} size={size} />
  </IconWrapper>
);

export const QuoteIcon: React.FC<IconProps> = ({ color = '#000', size = 24 }) => (
  <IconWrapper size={size}>
    <Quote color={color} size={size} />
  </IconWrapper>
);

// Additional icons for profile
export const HeartIcon: React.FC<IconProps> = ({ color = '#000', size = 24 }) => (
  <IconWrapper size={size}>
    <Heart color={color} size={size} />
  </IconWrapper>
);

export const MessageCircle: React.FC<IconProps> = ({ color = '#000', size = 24 }) => (
  <IconWrapper size={size}>
    <MessageCircleIcon color={color} size={size} />
  </IconWrapper>
);

export const UsersIconAlt: React.FC<IconProps> = ({ color = '#000', size = 24 }) => (
  <IconWrapper size={size}>
    <Users color={color} size={size} />
  </IconWrapper>
);

export const EditIcon: React.FC<IconProps> = ({ color = '#000', size = 24 }) => (
  <IconWrapper size={size}>
    <Edit3 color={color} size={size} />
  </IconWrapper>
);

export const CameraIcon: React.FC<IconProps> = ({ color = '#000', size = 24 }) => (
  <IconWrapper size={size}>
    <Camera color={color} size={size} />
  </IconWrapper>
);

export const SettingsIcon: React.FC<IconProps> = ({ color = '#000', size = 24 }) => (
  <IconWrapper size={size}>
    <Settings color={color} size={size} />
  </IconWrapper>
);

export const ArrowLeftIcon: React.FC<IconProps> = ({ color = '#000', size = 24 }) => (
  <IconWrapper size={size}>
    <ArrowLeft color={color} size={size} />
  </IconWrapper>
);