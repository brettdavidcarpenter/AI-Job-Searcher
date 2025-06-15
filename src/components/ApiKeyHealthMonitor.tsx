
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { getApiKeyHealthStatus, getHealthStatusSummary, isKeyCurrentlyHealthy, type ApiKeyHealthData } from "@/services/apiKeyHealthService";

export const ApiKeyHealthMonitor = () => {
  const [healthData, setHealthData] = useState<ApiKeyHealthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        setLoading(true);
        const data = await getApiKeyHealthStatus();
        setHealthData(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch API key health data');
        console.error('Error fetching health data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHealthData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchHealthData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>API Key Health Monitor</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading health data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>API Key Health Monitor</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const summary = getHealthStatusSummary(healthData);

  const getKeyStatusIcon = (key: ApiKeyHealthData) => {
    if (isKeyCurrentlyHealthy(key)) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else if (key.rate_limited_until && new Date(key.rate_limited_until) > new Date()) {
      return <Clock className="h-4 w-4 text-yellow-600" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getKeyStatusBadge = (key: ApiKeyHealthData) => {
    if (isKeyCurrentlyHealthy(key)) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Healthy</Badge>;
    } else if (key.rate_limited_until && new Date(key.rate_limited_until) > new Date()) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Rate Limited</Badge>;
    } else {
      return <Badge variant="destructive">Failed</Badge>;
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'Never';
    return new Date(timeString).toLocaleString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          API Key Health Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{summary.healthyKeys}</div>
            <div className="text-sm text-gray-600">Healthy Keys</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{summary.rateLimitedKeys}</div>
            <div className="text-sm text-gray-600">Rate Limited</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.totalRequestsToday}</div>
            <div className="text-sm text-gray-600">Requests Today</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">{summary.averageSuccessRate.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Avg Success Rate</div>
          </div>
        </div>

        {/* Individual key status */}
        <div className="space-y-3">
          <h4 className="font-medium">Individual Key Status</h4>
          {healthData.length === 0 ? (
            <p className="text-gray-500">No API key health data available. Keys will appear after first use.</p>
          ) : (
            healthData.map((key) => (
              <div key={key.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getKeyStatusIcon(key)}
                    <span className="font-medium">{key.key_name}</span>
                    {getKeyStatusBadge(key)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {key.success_rate.toFixed(1)}% success rate
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Last Success:</span>
                    <div>{formatTime(key.last_success)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Failure:</span>
                    <div>{formatTime(key.last_failure)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Consecutive Failures:</span>
                    <div>{key.consecutive_failures}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Requests Today:</span>
                    <div>{key.total_requests_today}</div>
                  </div>
                </div>
                
                {key.rate_limited_until && new Date(key.rate_limited_until) > new Date() && (
                  <div className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
                    Rate limited until: {formatTime(key.rate_limited_until)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
