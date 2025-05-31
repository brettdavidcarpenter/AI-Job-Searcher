
interface SearchStatsProps {
  totalJobs: number;
}

export const SearchStats = ({ totalJobs }: SearchStatsProps) => {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-semibold text-gray-900">
        {totalJobs}+ recent AI jobs found
      </h2>
      <div className="text-sm text-gray-500">
        Updated just now • Last 4 weeks
      </div>
    </div>
  );
};
