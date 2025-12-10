import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { NebulaModelManager } from '@/components/admin/NebulaModelManager';
import { useNebula } from '@/hooks/useNebula';

export default function NebulaDashboard() {
  const { getAnalytics } = useNebula();
  const [analytics, setAnalytics] = useState<NebulaAnalytics | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    const data = await getAnalytics();
    setAnalytics(data);
  };

  return (
    <ScrollView className="flex-1 bg-gray-900">
      <View className="p-4">
        <Text className="text-2xl text-white font-bold mb-6">
          Nebula AI Dashboard
        </Text>
        
        {/* Analytics Overview */}
        <View className="bg-gray-800 rounded-xl p-4 mb-4">
          <Text className="text-white text-lg font-semibold mb-3">
            Performance Metrics
          </Text>
          <View className="flex-row flex-wrap justify-between">
            <View className="bg-purple-900/30 p-3 rounded-lg mb-2 w-[48%]">
              <Text className="text-purple-300 text-sm">Total Requests</Text>
              <Text className="text-white text-2xl font-bold">
                {analytics?.requests || 0}
              </Text>
            </View>
            <View className="bg-blue-900/30 p-3 rounded-lg mb-2 w-[48%]">
              <Text className="text-blue-300 text-sm">Model Accuracy</Text>
              <Text className="text-white text-2xl font-bold">
                {(analytics?.accuracy || 0).toFixed(2)}%
              </Text>
            </View>
          </View>
        </View>
        
        {/* Model Management */}
        <NebulaModelManager />
        
        {/* Quick Actions */}
        <View className="bg-gray-800 rounded-xl p-4 mb-4">
          <Text className="text-white text-lg font-semibold mb-3">
            Quick Actions
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <TouchableOpacity className="bg-green-600 px-4 py-2 rounded-lg">
              <Text className="text-white">Train Model</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-blue-600 px-4 py-2 rounded-lg">
              <Text className="text-white">Run Test</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-purple-600 px-4 py-2 rounded-lg">
              <Text className="text-white">Export Data</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}