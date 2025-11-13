'use client';

import { useEffect, useState } from 'react';
import { ConditionalStep } from '@fieldform/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@fieldform/ui';
import { GitBranch, CheckCircle2, ArrowRight } from 'lucide-react';

interface ConditionalStepRendererProps {
  step: ConditionalStep;
  workOrderId: string;
  stepIndex: number;
  stepData: Record<string, any>; // Data from previous steps
  onComplete: (data: { branchIndex: number; branchTaken: 'default' | number }) => void;
}

export function ConditionalStepRenderer({
  step,
  workOrderId,
  stepIndex,
  stepData,
  onComplete,
}: ConditionalStepRendererProps) {
  const [evaluating, setEvaluating] = useState(true);
  const [result, setResult] = useState<{ branchIndex: number; branchTaken: string; matched: boolean } | null>(null);

  useEffect(() => {
    evaluateCondition();
  }, []);

  const evaluateCondition = () => {
    setEvaluating(true);

    try {
      // Get the source step data
      const sourceData = stepData[step.config.sourceStepId];

      if (!sourceData) {
        console.error('Source step data not found:', step.config.sourceStepId);
        setEvaluating(false);
        return;
      }

      // Get the field value
      const fieldValue = sourceData[step.config.fieldId];

      // Evaluate each branch condition
      let matchedBranch = -1;
      for (let i = 0; i < step.config.branches.length; i++) {
        const branch = step.config.branches[i];
        const matched = evaluateSingleCondition(
          fieldValue,
          branch.condition.operator,
          branch.condition.value
        );

        if (matched) {
          matchedBranch = i;
          break;
        }
      }

      // Determine result
      if (matchedBranch >= 0) {
        setResult({
          branchIndex: matchedBranch,
          branchTaken: `Branch ${matchedBranch + 1}`,
          matched: true,
        });
        setEvaluating(false);

        // Auto-complete after brief delay to show result
        setTimeout(() => {
          onComplete({ branchIndex: matchedBranch, branchTaken: matchedBranch });
        }, 1500);
      } else {
        // No match - use default branch
        setResult({
          branchIndex: -1,
          branchTaken: 'Default Branch',
          matched: false,
        });
        setEvaluating(false);

        // Auto-complete after brief delay
        setTimeout(() => {
          onComplete({ branchIndex: -1, branchTaken: 'default' });
        }, 1500);
      }
    } catch (error) {
      console.error('Error evaluating condition:', error);
      setEvaluating(false);
    }
  };

  const evaluateSingleCondition = (
    value: any,
    operator: string,
    compareValue: any
  ): boolean => {
    switch (operator) {
      case 'equals':
        // Handle boolean comparison with type coercion
        if (typeof value === 'boolean' || typeof compareValue === 'boolean') {
          return Boolean(value) === Boolean(compareValue);
        }
        // Loose equality for other types
        return value == compareValue;

      case 'contains':
        if (typeof value === 'string' && typeof compareValue === 'string') {
          return value.toLowerCase().includes(compareValue.toLowerCase());
        }
        if (Array.isArray(value)) {
          return value.includes(compareValue);
        }
        return false;

      case 'greater_than':
        return Number(value) > Number(compareValue);

      case 'less_than':
        return Number(value) < Number(compareValue);

      case 'in':
        const inList = Array.isArray(compareValue)
          ? compareValue
          : compareValue.split(',').map((v: string) => v.trim());
        return inList.includes(value);

      case 'not_in':
        const notInList = Array.isArray(compareValue)
          ? compareValue
          : compareValue.split(',').map((v: string) => v.trim());
        return !notInList.includes(value);

      default:
        console.warn('Unknown operator:', operator);
        return false;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <GitBranch className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Conditional Branch</CardTitle>
              <CardDescription>{step.description || 'Evaluating condition...'}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {evaluating && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
              <div className="flex items-center gap-3">
                <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Evaluating condition...
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Checking field value from previous step
                  </p>
                </div>
              </div>
            </div>
          )}

          {!evaluating && result && (
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Condition evaluated successfully
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    {result.matched
                      ? `Condition matched - taking ${result.branchTaken}`
                      : 'No conditions matched - taking default branch'}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                    <ArrowRight className="h-4 w-4" />
                    <span>Proceeding to next steps...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Branch Info */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Configured Branches:</p>
            <div className="space-y-1">
              {step.config.branches.map((branch, index) => {
                // Format value display for different types
                let displayValue = branch.condition.value;
                if (typeof displayValue === 'boolean') {
                  displayValue = displayValue ? 'Checked (Yes)' : 'Unchecked (No)';
                } else {
                  displayValue = String(displayValue || '');
                }

                return (
                  <div
                    key={index}
                    className={`p-2 text-xs rounded border ${
                      result && result.branchIndex === index
                        ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800'
                        : 'bg-muted/30 border-border'
                    }`}
                  >
                    <span className="font-medium">Branch {index + 1}:</span>{' '}
                    {branch.condition.operator} &quot;{displayValue}&quot;
                    {result && result.branchIndex === index && (
                      <span className="ml-2 text-green-600 dark:text-green-400">✓ Selected</span>
                    )}
                  </div>
                );
              })}
              {step.config.defaultBranch && step.config.defaultBranch.length > 0 && (
                <div
                  className={`p-2 text-xs rounded border ${
                    result && !result.matched
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800'
                      : 'bg-muted/30 border-border'
                  }`}
                >
                  <span className="font-medium">Default Branch</span> (if no conditions match)
                  {result && !result.matched && (
                    <span className="ml-2 text-green-600 dark:text-green-400">✓ Selected</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
