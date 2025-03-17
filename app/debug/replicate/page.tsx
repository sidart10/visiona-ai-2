"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlertCircle, Check } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ReplicateDebugPage() {
  const [version, setVersion] = useState("");
  const [inputJson, setInputJson] = useState(JSON.stringify({ dummy: "test" }, null, 2));
  const [simplifiedTest, setSimplifiedTest] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  async function handleTest() {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      let inputData = {};
      try {
        inputData = JSON.parse(inputJson);
      } catch (e) {
        setError("Invalid JSON input");
        setLoading(false);
        return;
      }
      
      const response = await fetch("/api/debug/replicate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: version || undefined,
          input: inputData,
          simplifiedTest
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || "Error testing Replicate API");
        setResult(data);
      } else {
        setResult(data);
      }
    } catch (e: any) {
      setError(e.message || "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Replicate API Debug Tool</h1>
      <p className="mb-8 text-muted-foreground">
        Use this tool to test Replicate API calls directly and diagnose issues
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Test Configuration</CardTitle>
            <CardDescription>Configure your Replicate API test</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="version">Version ID (optional, uses .env if empty)</Label>
              <Input 
                id="version" 
                placeholder="e.g., user/model:hash" 
                value={version} 
                onChange={e => setVersion(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2 py-4">
              <Switch 
                id="simplified" 
                checked={simplifiedTest}
                onCheckedChange={setSimplifiedTest}
              />
              <Label htmlFor="simplified">Use simplified test (recommended)</Label>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="input">Input JSON</Label>
              <Textarea 
                id="input" 
                rows={8}
                value={inputJson}
                onChange={e => setInputJson(e.target.value)}
                className="font-mono"
                placeholder="Enter input JSON..."
              />
              <p className="text-xs text-muted-foreground">
                For the full test, provide parameters required by the model
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleTest} 
              disabled={loading}
              className="w-full"
            >
              {loading ? "Testing..." : "Test Replicate API"}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>Results from Replicate API test</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {result && !error && (
              <Alert variant={result.success ? "default" : "destructive"} className="mb-4">
                <Check className="h-4 w-4" />
                <AlertTitle>{result.success ? "Success" : "Failed"}</AlertTitle>
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>
            )}
            
            {result && (
              <div className="mt-4">
                <h3 className="font-semibold text-sm mb-2">Response Data:</h3>
                <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-[400px]">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 