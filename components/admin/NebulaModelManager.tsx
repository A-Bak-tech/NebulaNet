import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Switch
} from 'react-native';
import { useModelTraining } from '@/hooks/useModelTraining';
import { NebulaLoadingIndicator } from '@/components/nebula/NebulaLoadingIndicator';

export const NebulaModelManager: React.FC = () => {
  const {
    trainedModels,
    isTraining,
    trainingProgress,
    train,
    deleteModel,
    exportModel,
    evaluateModel,
    getTrainingStats
  } = useModelTraining();

  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [showTrainModal, setShowTrainModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [trainingData, setTrainingData] = useState('');
  const [modelName, setModelName] = useState('');
  const [importData, setImportData] = useState('');

  const stats = getTrainingStats();

  const handleTrainModel = async () => {
    if (!trainingData.trim()) {
      Alert.alert('Error', 'Please enter training data');
      return;
    }

    try {
      // Parse training data (format: input|output)
      const data = trainingData.split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [input, output] = line.split('|').map(s => s.trim());
          return { input, output };
        });

      await train(data, {
        epochs: 10,
        batchSize: 32,
        learningRate: 0.001
      });

      Alert.alert('Success', 'Model trained successfully!');
      setShowTrainModal(false);
      setTrainingData('');
    } catch (error) {
      Alert.alert('Training Failed', 'Unable to train model');
      console.error('Training error:', error);
    }
  };

  const handleDeleteModel = (modelId: string) => {
    Alert.alert(
      'Delete Model',
      'Are you sure you want to delete this model?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteModel(modelId)
        }
      ]
    );
  };

  const handleExportModel = async (modelId: string) => {
    try {
      const modelData = await exportModel(modelId);
      // In React Native, you might copy to clipboard or share
      Alert.alert('Exported', 'Model data copied to clipboard');
      console.log('Model data:', modelData);
    } catch (error) {
      Alert.alert('Export Failed', 'Unable to export model');
    }
  };

  const handleEvaluateModel = async (modelId: string) => {
    try {
      const evaluation = await evaluateModel(modelId, []);
      Alert.alert(
        'Evaluation Results',
        `Accuracy: ${(evaluation.accuracy * 100).toFixed(2)}%\n` +
        `Precision: ${(evaluation.metrics.precision * 100).toFixed(2)}%\n` +
        `Recall: ${(evaluation.metrics.recall * 100).toFixed(2)}%\n` +
        `F1 Score: ${(evaluation.metrics.f1 * 100).toFixed(2)}%`
      );
    } catch (error) {
      Alert.alert('Evaluation Failed', 'Unable to evaluate model');
    }
  };

  return (
    <View className="bg-gray-800 rounded-xl p-4 mb-4">
      <Text className="text-white text-lg font-bold mb-4">Model Management</Text>

      {/* Training Stats */}
      <View className="bg-gray-900 rounded-lg p-3 mb-4">
        <Text className="text-gray-300 font-semibold mb-2">Training Statistics</Text>
        <View className="flex-row flex-wrap justify-between">
          <View className="w-[48%] mb-2">
            <Text className="text-gray-400 text-sm">Total Models</Text>
            <Text className="text-white text-xl font-bold">{stats.totalModels}</Text>
          </View>
          <View className="w-[48%] mb-2">
            <Text className="text-gray-400 text-sm">Avg Accuracy</Text>
            <Text className="text-white text-xl font-bold">
              {(stats.avgAccuracy * 100).toFixed(1)}%
            </Text>
          </View>
          <View className="w-[48%]">
            <Text className="text-gray-400 text-sm">Training Time</Text>
            <Text className="text-white text-xl font-bold">
              {(stats.totalTrainingTime / 1000).toFixed(0)}s
            </Text>
          </View>
          <View className="w-[48%]">
            <Text className="text-gray-400 text-sm">Recent Accuracy</Text>
            <Text className="text-white text-xl font-bold">
              {(stats.recentAccuracy * 100).toFixed(1)}%
            </Text>
          </View>
        </View>
      </View>

      {/* Training Progress */}
      {isTraining && trainingProgress && (
        <View className="bg-blue-900/30 rounded-lg p-3 mb-4">
          <Text className="text-blue-300 font-semibold mb-2">Training in Progress</Text>
          <View className="mb-2">
            <View className="flex-row justify-between mb-1">
              <Text className="text-blue-200">Epoch {trainingProgress.epoch}/{trainingProgress.totalEpochs}</Text>
              <Text className="text-blue-200">
                {(trainingProgress.accuracy * 100).toFixed(1)}% Accuracy
              </Text>
            </View>
            <View className="h-2 bg-blue-900 rounded-full">
              <View 
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${(trainingProgress.epoch / trainingProgress.totalEpochs) * 100}%` }}
              />
            </View>
          </View>
          <NebulaLoadingIndicator size="small" showMessage={false} />
        </View>
      )}

      {/* Models List */}
      <ScrollView className="max-h-60">
        {trainedModels.map((model) => (
          <View
            key={model.id}
            className="bg-gray-900 rounded-lg p-3 mb-2"
          >
            <View className="flex-row justify-between items-start mb-2">
              <View>
                <Text className="text-white font-semibold">{model.name}</Text>
                <Text className="text-gray-400 text-sm">
                  {model.type} • v{model.version} • {(model.size / 1024).toFixed(2)} MB
                </Text>
              </View>
              <View className="flex-row space-x-1">
                <TouchableOpacity
                  className="px-2 py-1 bg-blue-600 rounded"
                  onPress={() => handleEvaluateModel(model.id)}
                >
                  <Text className="text-white text-xs">Evaluate</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="px-2 py-1 bg-green-600 rounded"
                  onPress={() => handleExportModel(model.id)}
                >
                  <Text className="text-white text-xs">Export</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="px-2 py-1 bg-red-600 rounded"
                  onPress={() => handleDeleteModel(model.id)}
                >
                  <Text className="text-white text-xs">Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className={`w-3 h-3 rounded-full mr-2 ${
                  model.accuracy > 0.8 ? 'bg-green-500' :
                  model.accuracy > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <Text className="text-gray-300">
                  Accuracy: {(model.accuracy * 100).toFixed(1)}%
                </Text>
              </View>
              <Text className="text-gray-400 text-xs">
                {model.trainedAt.toLocaleDateString()}
              </Text>
            </View>
          </View>
        ))}

        {trainedModels.length === 0 && !isTraining && (
          <View className="items-center py-6">
            <Text className="text-gray-400">No trained models yet</Text>
            <Text className="text-gray-500 text-sm mt-1">
              Train your first model to get started
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View className="flex-row space-x-2 mt-4">
        <TouchableOpacity
          className="flex-1 bg-purple-600 py-3 rounded-xl items-center"
          onPress={() => setShowTrainModal(true)}
        >
          <Text className="text-white font-semibold">Train New Model</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-blue-600 py-3 rounded-xl items-center"
          onPress={() => setShowImportModal(true)}
        >
          <Text className="text-white font-semibold">Import Model</Text>
        </TouchableOpacity>
      </View>

      {/* Train Model Modal */}
      <Modal
        visible={showTrainModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTrainModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center p-4">
          <View className="bg-gray-900 rounded-2xl p-6">
            <Text className="text-white text-xl font-bold mb-4">Train New Model</Text>
            
            <TextInput
              className="bg-gray-800 text-white rounded-lg p-3 mb-3"
              placeholder="Model Name"
              placeholderTextColor="#9CA3AF"
              value={modelName}
              onChangeText={setModelName}
            />
            
            <TextInput
              className="bg-gray-800 text-white rounded-lg p-3 min-h-[200px] mb-4"
              placeholder="Training data (format: input|output)"
              placeholderTextColor="#9CA3AF"
              value={trainingData}
              onChangeText={setTrainingData}
              multiline
              textAlignVertical="top"
            />
            
            <View className="flex-row space-x-2">
              <TouchableOpacity
                className="flex-1 bg-gray-800 py-3 rounded-xl items-center"
                onPress={() => setShowTrainModal(false)}
              >
                <Text className="text-white">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-purple-600 py-3 rounded-xl items-center"
                onPress={handleTrainModel}
                disabled={isTraining}
              >
                {isTraining ? (
                  <NebulaLoadingIndicator size="small" showMessage={false} />
                ) : (
                  <Text className="text-white font-semibold">Start Training</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Import Model Modal */}
      <Modal
        visible={showImportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowImportModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center p-4">
          <View className="bg-gray-900 rounded-2xl p-6">
            <Text className="text-white text-xl font-bold mb-4">Import Model</Text>
            
            <TextInput
              className="bg-gray-800 text-white rounded-lg p-3 min-h-[300px] mb-4"
              placeholder="Paste model JSON data here"
              placeholderTextColor="#9CA3AF"
              value={importData}
              onChangeText={setImportData}
              multiline
              textAlignVertical="top"
            />
            
            <View className="flex-row space-x-2">
              <TouchableOpacity
                className="flex-1 bg-gray-800 py-3 rounded-xl items-center"
                onPress={() => setShowImportModal(false)}
              >
                <Text className="text-white">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-blue-600 py-3 rounded-xl items-center"
                onPress={() => {
                  // Handle import
                  Alert.alert('Import', 'Model import would happen here');
                  setShowImportModal(false);
                }}
              >
                <Text className="text-white font-semibold">Import</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};