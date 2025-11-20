import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { getApiUrl } from '@/lib/config';

/**
 * Generic hook for loading vendor data with consistent behavior
 * Handles refresh, tab switching, and data loading automatically
 * 
 * Usage:
 * const { data, isLoading, error } = useVendorData<Order[]>({
 *   endpoint: 'orders',
 *   queryKey: 'orders'
 * });
 */
interface UseVendorDataOptions<T> {
  endpoint: string;
  queryKey: string | string[];
  params?: Record<string, string>;
  enabled?: boolean;
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn' | 'enabled'>;
}

export function useVendorData<T>({
  endpoint,
  queryKey,
  params,
  enabled = true,
  options,
}: UseVendorDataOptions<T>) {
  const { vendorId } = useAuth();

  // Build query parameters
  const queryParams = params ? new URLSearchParams(params).toString() : '';
  const url = `/api/vendors/${vendorId}/${endpoint}${queryParams ? `?${queryParams}` : ''}`;

  // Normalize queryKey to array
  const normalizedQueryKey = Array.isArray(queryKey) ? queryKey : [queryKey];
  const fullQueryKey = [`/api/vendors/${vendorId}`, ...normalizedQueryKey];

  return useQuery<T>({
    queryKey: fullQueryKey,
    queryFn: async () => {
      const fullUrl = getApiUrl(url);
      const response = await fetch(fullUrl, {
        credentials: "include",
        headers: {
          ...(localStorage.getItem('token') && { 'Authorization': `Bearer ${localStorage.getItem('token')}` })
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch ${endpoint}`);
      }
      return response.json();
    },
    enabled: !!vendorId && enabled,
    staleTime: 0, // Always refetch on mount
    refetchOnMount: true, // Refetch when component mounts
    ...options,
  });
}

/**
 * Hook for loading general data (not vendor-specific)
 */
interface UseDataOptions<T> {
  endpoint: string;
  queryKey: string | string[];
  params?: Record<string, string>;
  enabled?: boolean;
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn' | 'enabled'>;
}

export function useData<T>({
  endpoint,
  queryKey,
  params,
  enabled = true,
  options,
}: UseDataOptions<T>) {
  // Build query parameters
  const queryParams = params ? new URLSearchParams(params).toString() : '';
  const url = `${endpoint}${queryParams ? `?${queryParams}` : ''}`;

  // Normalize queryKey to array
  const normalizedQueryKey = Array.isArray(queryKey) ? queryKey : [queryKey];

  return useQuery<T>({
    queryKey: normalizedQueryKey,
    queryFn: async () => {
      const fullUrl = getApiUrl(url);
      const response = await fetch(fullUrl, {
        credentials: "include",
        headers: {
          ...(localStorage.getItem('token') && { 'Authorization': `Bearer ${localStorage.getItem('token')}` })
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch from ${endpoint}`);
      }
      return response.json();
    },
    enabled,
    staleTime: 0,
    refetchOnMount: true,
    ...options,
  });
}

/**
 * Hook for vendor with proper loading state
 */
export function useVendor() {
  const { vendorId } = useAuth();

  return useQuery({
    queryKey: [`/api/vendors/${vendorId}`],
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/api/vendors/${vendorId}`));
      if (!response.ok) throw new Error('Failed to fetch vendor');
      return response.json();
    },
    enabled: !!vendorId,
    staleTime: 5 * 60 * 1000, // Cache vendor info for 5 minutes
  });
}

