import { Text, View } from "@tarojs/components";
import BackButton from "../../components/BackButton";
import { motionClass, navigate, safeArea } from "../../platform/current";

export default function About() {
  return (
    <View className={`page ${motionClass}`} style={{ paddingTop: `calc(16px + ${safeArea.top})`, paddingBottom: `calc(32px + ${safeArea.bottom})` }}>
      <View className="stage">
        <View className="screen screen-about" data-testid="about">
          <BackButton label="回到我的" action="me" onTap={() => navigate.back("me")} />
          <View className="about-hero">
            <Text className="about-kicker">NUMBER SENSE LAB</Text>
            <Text className="title">一间陪孩子慢慢长大的数学实验室</Text>
            <Text className="about-lede">这是父母陪孩子一起做的一间数学实验室。它想提供陪伴和工具，而不是居高临下的评价。</Text>
          </View>

          <View className="about-section">
            <Text className="about-index">01</Text>
            <View className="about-copy">
              <Text className="about-title">为什么做它</Text>
              <Text className="about-text">很多孩子并不是不会数学，只是一些基础、常用的数字关系还没有真正熟悉。我们希望每天用一小段自在的时间，把“会做”慢慢变成更可靠的计算直觉。</Text>
            </View>
          </View>
          <View className="about-section">
            <Text className="about-index">02</Text>
            <View className="about-copy">
              <Text className="about-title">怎样陪伴学习</Text>
              <Text className="about-text">不催速度，不比排名，不用题量制造压力。允许停下来、看关系、换一种方法，再回到题目里。</Text>
            </View>
          </View>
          <View className="about-section">
            <Text className="about-index">03</Text>
            <View className="about-copy">
              <Text className="about-title">怎样看待错误</Text>
              <Text className="about-text">错误不是惩罚的理由，而是发现思路、补足关系的线索。错题本只留下现在仍需要帮助的部分，熟悉以后就安静离开。</Text>
            </View>
          </View>
          <View className="about-section">
            <Text className="about-index">04</Text>
            <View className="about-copy">
              <Text className="about-title">数据放在哪里</Text>
              <Text className="about-text">首版练习记录和昵称默认只保存在当前设备，不自动上传，也不会自动同步到其他设备。</Text>
            </View>
          </View>

          <View className="about-foot">
            <Text className="about-foot-name">Number Sense Lab｜数感训练场</Text>
            <Text className="about-foot-note">从真实家庭学习场景里长出来，也会和孩子一起继续生长。</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
