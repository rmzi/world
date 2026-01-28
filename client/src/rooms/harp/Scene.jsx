import PointCloudSphere from '../../components/PointCloudSphere'

// Harp room scene - wraps the PointCloudSphere with room context awareness
// Room context is available via useRoomContext() for future enhancements
export default function HarpScene() {
  // The PointCloudSphere already connects to the store directly
  return <PointCloudSphere visible={true} />
}
