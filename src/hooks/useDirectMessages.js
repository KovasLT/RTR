// hooks/useDirectMessages.js (excerpt)
export function useConversations() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['conversations', user?.id],
        queryFn: async () => {
            if (!user) return [];
            // ... your existing logic to fetch conversations with unread_count
            // (use a single RPC or combine queries)
            return processedConversations;
        },
        enabled: !!user,
        staleTime: Infinity,          // never refetch on its own
        refetchOnMount: false,        // don't refetch when component mounts
        refetchOnWindowFocus: false,  // don't refetch on tab focus
    });
}
