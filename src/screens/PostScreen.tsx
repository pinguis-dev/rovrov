import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  launchImageLibrary,
  launchCamera,
  ImagePickerResponse,
  MediaType,
} from 'react-native-image-picker';

type Visibility = 'public' | 'friends' | 'private';

export const PostScreen: React.FC = () => {
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [pinName, setPinName] = useState('');

  const handleMediaSelection = () => {
    Alert.alert(
      'Select Media',
      'Choose from where you want to select media',
      [
        { text: 'Camera', onPress: openCamera },
        { text: 'Gallery', onPress: openGallery },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  const openCamera = () => {
    const options = {
      mediaType: 'mixed' as MediaType,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    launchCamera(options, handleImageResponse);
  };

  const openGallery = () => {
    const options = {
      mediaType: 'mixed' as MediaType,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      selectionLimit: 10,
    };

    launchImageLibrary(options, handleImageResponse);
  };

  const handleImageResponse = (response: ImagePickerResponse) => {
    if (response.didCancel || response.errorMessage) {
      return;
    }

    if (response.assets) {
      const newMedia = response.assets
        .map(asset => asset.uri)
        .filter((uri): uri is string => uri !== undefined);
      setSelectedMedia([...selectedMedia, ...newMedia]);
    }
  };

  const removeMedia = (index: number) => {
    setSelectedMedia(selectedMedia.filter((_, i) => i !== index));
  };

  const handlePost = () => {
    // TODO: Implement post creation with Supabase
    console.log('Creating post:', { caption, visibility, pinName, media: selectedMedia });
    Alert.alert('Success', 'Post created successfully!');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create Post</Text>
        </View>

        <TouchableOpacity style={styles.mediaButton} onPress={handleMediaSelection}>
          <Text style={styles.mediaButtonText}>+ Add Photos/Videos</Text>
        </TouchableOpacity>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaPreview}>
          {selectedMedia.map((uri, index) => (
            <View key={index} style={styles.mediaItem}>
              <Image source={{ uri }} style={styles.mediaThumbnail} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeMedia(index)}>
                <Text style={styles.removeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Caption</Text>
          <TextInput
            style={styles.captionInput}
            placeholder="Write a caption..."
            value={caption}
            onChangeText={setCaption}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="Add location..."
            value={pinName}
            onChangeText={setPinName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Visibility</Text>
          <View style={styles.visibilityOptions}>
            {(['public', 'friends', 'private'] as Visibility[]).map(option => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.visibilityOption,
                  visibility === option && styles.visibilityOptionActive,
                ]}
                onPress={() => setVisibility(option)}>
                <Text
                  style={[
                    styles.visibilityOptionText,
                    visibility === option && styles.visibilityOptionTextActive,
                  ]}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.draftButton}>
            <Text style={styles.draftButtonText}>Save as Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.postButton} onPress={handlePost}>
            <Text style={styles.postButtonText}>Post</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  mediaButton: {
    margin: 20,
    padding: 40,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  mediaButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  mediaPreview: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  mediaItem: {
    marginRight: 10,
    position: 'relative',
  },
  mediaThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  inputContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  captionInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  visibilityOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  visibilityOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  visibilityOptionActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  visibilityOptionText: {
    fontSize: 14,
    color: '#666',
  },
  visibilityOptionTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  draftButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
  },
  draftButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  postButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  postButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});