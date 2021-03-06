import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image, Alert } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
  category_id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  category: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      api.get<Food>(`foods/${routeParams.id}`).then(response => {
        if (response.data) {
          const foodExtras = response.data.extras.map(extra => {
            return {
              id: extra.id,
              name: extra.name,
              value: extra.value,
              quantity: 0,
            };
          });

          const requestFood = {
            id: Number(response.data.id),
            name: response.data.name,
            description: response.data.description,
            price: Number(response.data.price),
            category: Number(response.data.category),
            image_url: response.data.image_url,
            formattedPrice: formatValue(response.data.price),
            extras: foodExtras,
          };

          setFood(requestFood);
          setExtras(foodExtras);
        }
      });
    }

    loadFood();
  }, [routeParams /* , food.extras */]);

  function handleIncrementExtra(id: number): void {
    const extra = extras.find(item => item.id === id);

    if (extra) {
      extra.quantity += 1;

      const extrasCollection = extras.filter(item => item.id !== id);
      extrasCollection.push(extra);

      setExtras(extrasCollection);
    }
  }

  function handleDecrementExtra(id: number): void {
    const extra = extras.find(item => item.id === id);

    if (extra) {
      if (extra.quantity > 0) {
        extra.quantity -= 1;

        const extrasCollection = extras.filter(item => item.id !== id);
        extrasCollection.push(extra);

        setExtras(extrasCollection);
      }
    }
  }

  function handleIncrementFood(): void {
    const quantity = foodQuantity + 1;
    setFoodQuantity(quantity);
  }

  function handleDecrementFood(): void {
    if (foodQuantity > 1) {
      const quantity = foodQuantity - 1;
      setFoodQuantity(quantity);
    }
  }

  const toggleFavorite = useCallback(() => {
    setIsFavorite(!isFavorite);

    // TODO food???
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    let totalValue = food.price;

    if (extras) {
      extras.forEach(extra => {
        totalValue += extra.value * extra.quantity;
      });
    }

    return formatValue(totalValue * foodQuantity);
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    try {
      const foodOrder = {
        product_id: food.id,
        name: food.name,
        description: food.description,
        price: food.price * foodQuantity,
        category: food.category,
        thumbnail_url: food.image_url,
        extras,
      };

      await api.post('orders', foodOrder);

      navigation.navigate('Orders');
    } catch (err) {
      Alert.alert(
        'Erro ao realizar o pedido.',
        'Pro favor, verifique as informações e tente novamente.',
      );
    }
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
