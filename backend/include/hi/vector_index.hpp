#pragma once
#include "common.hpp"
#include <algorithm>
#include <cmath>
#include <numeric>
#include <queue>
namespace hi {
// Balanced exact k-d tree over normalized vectors. Squared Euclidean distance
// equals 2*(1-cosine), so nearest neighbours preserve cosine ranking.
class VectorIndex {
  struct Point { size_t row; std::vector<double> values; };
  struct Node { size_t point, axis; int left=-1, right=-1; };
  std::vector<Point> points_;
  std::vector<Node> nodes_;
  size_t dimensions_=0;
  int root_=-1;
  static bool normalize(std::vector<double>& v) {
    double norm=0;
    for(double x:v){require(std::isfinite(x),"Invalid indexed vector");norm+=x*x;}
    if(norm==0)return false;
    require(std::isfinite(norm),"Invalid vector magnitude");
    norm=std::sqrt(norm);for(double& x:v)x/=norm;return true;
  }
  int build(std::vector<size_t>& order,size_t first,size_t last,size_t depth) {
    if(first==last)return -1;
    size_t axis=depth%dimensions_,mid=first+(last-first)/2;
    std::nth_element(order.begin()+first,order.begin()+mid,order.begin()+last,[&](size_t a,size_t b){
      if(points_[a].values[axis]==points_[b].values[axis])return points_[a].row<points_[b].row;
      return points_[a].values[axis]<points_[b].values[axis];
    });
    int node=int(nodes_.size());nodes_.push_back({order[mid],axis});
    int left=build(order,first,mid,depth+1),right=build(order,mid+1,last,depth+1);
    nodes_[node].left=left;nodes_[node].right=right;return node;
  }
  using Heap=std::priority_queue<std::pair<double,size_t>>;
  void visit(int n,const std::vector<double>& query,size_t k,Heap& best)const {
    if(n<0)return;
    const auto& node=nodes_[n];const auto& point=points_[node.point];
    double distance=0;
    for(size_t i=0;i<dimensions_;++i){double d=query[i]-point.values[i];distance+=d*d;}
    auto candidate=std::make_pair(distance,point.row);
    if(best.size()<k)best.push(candidate);
    else if(candidate<best.top()){best.pop();best.push(candidate);}
    double delta=query[node.axis]-point.values[node.axis];
    visit(delta<0?node.left:node.right,query,k,best);
    // Include the boundary so equal-distance ties remain deterministic.
    if(best.size()<k || delta*delta<=best.top().first)
      visit(delta<0?node.right:node.left,query,k,best);
  }
public:
  explicit VectorIndex(const std::vector<std::vector<double>>& vectors) {
    for(size_t i=0;i<vectors.size();++i){
      auto v=vectors[i];if(v.empty())continue;
      if(!dimensions_)dimensions_=v.size();
      require(v.size()==dimensions_,"Inconsistent embedding dimensions");
      if(normalize(v))points_.push_back({i,std::move(v)});
    }
    std::vector<size_t> order(points_.size());std::iota(order.begin(),order.end(),0);
    if(!order.empty())root_=build(order,0,order.size(),0);
  }
  std::vector<std::pair<size_t,double>> search(std::vector<double> query,size_t k=5)const {
    if(!k || root_<0 || query.size()!=dimensions_ || !normalize(query))return {};
    Heap heap;visit(root_,query,k,heap);
    std::vector<std::pair<size_t,double>> result;
    while(!heap.empty()){auto [distance,row]=heap.top();heap.pop();result.emplace_back(row,std::clamp(1-distance/2,-1.0,1.0));}
    std::reverse(result.begin(),result.end());return result;
  }
};
} // namespace hi
