import React, { useMemo } from 'react';
import { View, Pressable, GestureResponderEvent, Text, TextStyle } from 'react-native';
import { ChatMessageProps } from './message.types';
import { getMessageBaseStyles } from './message.styles';
import { mergeStyles } from '@/core/thread/utils';
import MessageBubble from './MessageBubble';
import { IPFSAwareImage, getValidImageSource } from '@/shared/utils/IPFSImage';
import { DEFAULT_IMAGES } from '@/shared/config/constants';
import Icons from '@/assets/svgs';
import COLORS from '@/assets/colors';

// Update ChatMessageProps to include onLongPress
interface ExtendedChatMessageProps extends ChatMessageProps {
  onLongPress?: (event: GestureResponderEvent) => void;
}

const formatTime = (timestamp: Date | string | undefined): string => {
  if (!timestamp) return '';
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  return `${Math.floor(diffInSeconds / 86400)}d`;
};

function ChatMessage({
  message,
  currentUser,
  onPressMessage,
  onLongPress,
  themeOverrides,
  styleOverrides,
}: ExtendedChatMessageProps) {
  const isCurrentUser = useMemo(() => {
    return (
      message.user.id === currentUser.id ||
      ('sender_id' in message && message.sender_id === currentUser.id) ||
      ('senderId' in message && message.senderId === currentUser.id)
    );
  }, [message, currentUser.id]);

  const timestamp = 'createdAt' in message ? message.createdAt : new Date();

  return (
    <Pressable
      onPress={() => onPressMessage && onPressMessage(message)}
      onLongPress={onLongPress}
      delayLongPress={500}
      disabled={!onPressMessage && !onLongPress}
      style={({ pressed }) => [{
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        opacity: pressed ? 0.8 : 1,
        width: '100%',
      }]}
    >
      {/* Avatar on the Left */}
      <View style={{ marginRight: 12, paddingTop: 2 }}>
        <IPFSAwareImage
          // @ts-ignore
          source={
            message.user?.avatar
              ? (getValidImageSource(message.user.avatar) as any)
              : DEFAULT_IMAGES.user
          }
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: COLORS.darkerBackground,
          }}
          defaultSource={DEFAULT_IMAGES.user}
        />
      </View>

      {/* Content Column */}
      <View style={{ flex: 1 }}>
        {/* Username + verified badge + timestamp */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{
            color: COLORS.white,
            fontSize: 16,
            fontWeight: '600',
            marginRight: 4
          }}>
            {message.user?.username || 'Anonymous'}
          </Text>

          {message.user?.verified && (
            <Text style={{ color: '#1D9BF0', marginRight: 6, fontSize: 14 }}>✓</Text>
          )}

          <Text style={{ color: COLORS.greyMid, fontSize: 13, fontWeight: '500' }}>
            {formatTime(timestamp)}
          </Text>
        </View>

        {/* Message Bubble/Content */}
        <MessageBubble
          message={message}
          isCurrentUser={isCurrentUser}
          themeOverrides={themeOverrides}
          styleOverrides={{
            ...styleOverrides,
            container: { paddingHorizontal: 0, paddingVertical: 0, backgroundColor: 'transparent', shadowOpacity: 0, elevation: 0, borderRadius: 0, marginVertical: 0, maxWidth: '100%' },
            currentUser: { backgroundColor: 'transparent', shadowOpacity: 0 },
            otherUser: { backgroundColor: 'transparent', borderWidth: 0 },
            text: { fontSize: 15, lineHeight: 22, color: COLORS.white },
            currentUserText: { textAlign: 'left', color: COLORS.white },
          }}
        />
      </View>
    </Pressable>
  );
}

export default ChatMessage; 